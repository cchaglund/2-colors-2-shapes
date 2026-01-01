import fs from "fs";
import path from "path";

const WORDS_DIR = path.resolve("words");

// Topics used to pull semantically related words
const TOPICS = [
    "chaos",
    "order",
    "motion",
    "stillness",
    "weight",
    "light",
    "dark",
    "texture",
    "emotion",
    "energy",
    "shape",
    "balance",
    "time",
    "space",
    "nature",
    "force",
    "silence",
    "sound",
    "abstract",
    "pattern"
];

// Filters
const MIN_LENGTH = 3;
const MAX_LENGTH = 10;
const MAX_PER_TOPIC = 120;

// Words we never want
const BLOCKLIST = new Set([
    "politics",
    "political",
    "democrat",
    "democracy",
    "sexual",
    "explicit",
    "religion",
    "religious"
]);

// Suffixes that usually feel wrong for prompts
const BAD_SUFFIXES = [
    "ized",
    "ization",
    "ality",
    "ically",
    "ologist",
    "ology",
    "fulness",
    "iveness"
];

function isValidWord(word) {
    if (!/^[a-z]+$/.test(word)) return false;
    if (word.length < MIN_LENGTH || word.length > MAX_LENGTH) return false;
    if (BLOCKLIST.has(word)) return false;
    if (BAD_SUFFIXES.some(s => word.endsWith(s))) return false;
    return true;
}

async function fetchWordsForTopic(topic) {
    const url = `https://api.datamuse.com/words?ml=${encodeURIComponent(
        topic
    )}&max=${MAX_PER_TOPIC}`;

    const res = await fetch(url);
    const data = await res.json();

    return data
        .map(x => x.word.toLowerCase())
        .filter(isValidWord);
}

function shuffle(array) {
    return array
        .map(v => ({ v, r: Math.random() }))
        .sort((a, b) => a.r - b.r)
        .map(x => x.v);
}

function nextFileName() {
    if (!fs.existsSync(WORDS_DIR)) {
        fs.mkdirSync(WORDS_DIR, { recursive: true });
    }

    const files = fs.readdirSync(WORDS_DIR);
    const numbers = files
        .map(f => f.match(/^words-(\d+)\.json$/))
        .filter(Boolean)
        .map(m => Number(m[ 1 ]));

    const next = numbers.length ? Math.max(...numbers) + 1 : 1;
    return path.join(WORDS_DIR, `words-${next}.json`);
}

async function main() {
    console.log("Fetching words…");

    const allWords = new Set();

    for (const topic of TOPICS) {
        try {
            const words = await fetchWordsForTopic(topic);
            words.forEach(w => allWords.add(w));
            console.log(`✓ ${topic}: ${words.length}`);
        } catch (err) {
            console.warn(`⚠ failed topic "${topic}"`, err.message);
        }
    }

    let finalList = shuffle([ ...allWords ]);

    const output = {
        generatedAt: new Date().toISOString(),
        total: finalList.length,
        words: finalList
    };

    const filename = nextFileName();
    fs.writeFileSync(filename, JSON.stringify(output, null, 2));

    console.log(`\n✅ Saved ${finalList.length} words to:`);
    console.log(filename);
}

main();