-- Drop unused columns from challenges table.
-- shape_1_svg/shape_2_svg were never read by the client (shapes are rendered from code).
-- shape_1_name/shape_2_name are redundant with the SHAPE_NAMES map in code.
ALTER TABLE challenges
  DROP COLUMN IF EXISTS shape_1_svg,
  DROP COLUMN IF EXISTS shape_2_svg,
  DROP COLUMN IF EXISTS shape_1_name,
  DROP COLUMN IF EXISTS shape_2_name;
