`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'profiles' ORDER BY ordinal_position;`

Results:
```
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "nickname",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "avatar_url",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "onboarding_complete",
    "data_type": "boolean",
    "is_nullable": "YES",
    "column_default": "false"
  },
  {
    "column_name": "is_admin",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  }
]
```

`SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'profiles';`

Results:

```
[
  {
    "policyname": "Anyone can read profiles",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "policyname": "Users can update own profile",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": "(auth.uid() = id)"
  },
  {
    "policyname": "Users can view own profile",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  }
]
```

`SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'submissions' ORDER BY ordinal_position;`

Results:
```
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "gen_random_uuid()"
  },
  {
    "column_name": "user_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "challenge_date",
    "data_type": "text",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "shapes",
    "data_type": "jsonb",
    "is_nullable": "NO",
    "column_default": null
  },
  {
    "column_name": "background_color_index",
    "data_type": "smallint",
    "is_nullable": "YES",
    "column_default": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "included_in_ranking",
    "data_type": "boolean",
    "is_nullable": "NO",
    "column_default": "false"
  },
  {
    "column_name": "groups",
    "data_type": "jsonb",
    "is_nullable": "YES",
    "column_default": "'[]'::jsonb"
  },
  {
    "column_name": "like_count",
    "data_type": "integer",
    "is_nullable": "NO",
    "column_default": "0"
  }
]
```

`SELECT policyname, cmd, qual, with_check FROM pg_policies WHERE tablename = 'submissions';`

Results:
```
[
  {
    "policyname": "Authenticated users can read submissions",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "policyname": "Users can delete own submissions",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "policyname": "Users can delete their own submissions",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "policyname": "Users can insert own submissions",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "policyname": "Users can insert their own submissions",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "policyname": "Users can update own submissions",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "policyname": "Users can update their own submissions",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": "(auth.uid() = user_id)"
  }
]
```

`SELECT indexname, indexdef FROM pg_indexes WHERE tablename IN ('profiles', 'submissions');`

Results: 
```
[
  {
    "policyname": "Authenticated users can read submissions",
    "cmd": "SELECT",
    "qual": "true",
    "with_check": null
  },
  {
    "policyname": "Users can delete own submissions",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "policyname": "Users can delete their own submissions",
    "cmd": "DELETE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "policyname": "Users can insert own submissions",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "policyname": "Users can insert their own submissions",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = user_id)"
  },
  {
    "policyname": "Users can update own submissions",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": null
  },
  {
    "policyname": "Users can update their own submissions",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = user_id)",
    "with_check": "(auth.uid() = user_id)"
  }
]
```