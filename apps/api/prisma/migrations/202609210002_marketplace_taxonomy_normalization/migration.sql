CREATE TABLE "MarketplacePlatform" (
  "key" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL,
  "nameFa" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "MarketplacePlatform_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "MarketplacePlatform_position_nameEn_idx" ON "MarketplacePlatform"("position", "nameEn");

INSERT INTO "MarketplacePlatform" ("key", "nameEn", "nameFa", "position") VALUES
  ('api', 'API', 'رابط برنامه‌نویسی', 10),
  ('chatgpt', 'ChatGPT', 'چت‌جی‌پی‌تی', 20),
  ('claude', 'Claude', 'کلود', 30),
  ('claude-code', 'Claude Code', 'کلود کد', 40),
  ('codex', 'Codex', 'کودکس', 50),
  ('cursor', 'Cursor', 'کرسر', 60),
  ('gemini', 'Gemini', 'جمینای', 70),
  ('gemini-cli', 'Gemini CLI', 'رابط خط فرمان جمینای', 80),
  ('vscode', 'VS Code', 'ویژوال استودیو کد', 90);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "MarketplaceReleaseCompatibility"
    GROUP BY "releaseManifestId", CASE lower(regexp_replace(trim("platformKey"), '[ _]+', '-', 'g'))
      WHEN 'vs-code' THEN 'vscode'
      WHEN 'claudecode' THEN 'claude-code'
      WHEN 'geminicli' THEN 'gemini-cli'
      ELSE lower(regexp_replace(trim("platformKey"), '[ _]+', '-', 'g'))
    END
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Platform alias collision requires manual compatibility metadata review before migration';
  END IF;
END;
$$;

UPDATE "MarketplaceReleaseCompatibility"
SET "platformKey" = CASE lower(regexp_replace(trim("platformKey"), '[ _]+', '-', 'g'))
  WHEN 'vs-code' THEN 'vscode'
  WHEN 'claudecode' THEN 'claude-code'
  WHEN 'geminicli' THEN 'gemini-cli'
  ELSE lower(regexp_replace(trim("platformKey"), '[ _]+', '-', 'g'))
END;

INSERT INTO "MarketplacePlatform" ("key", "nameEn", "position")
SELECT DISTINCT compatibility."platformKey", compatibility."platformKey", 1000
FROM "MarketplaceReleaseCompatibility" compatibility
LEFT JOIN "MarketplacePlatform" platform ON platform."key" = compatibility."platformKey"
WHERE platform."key" IS NULL;

UPDATE "MarketplaceCommunity"
SET "primaryPlatform" = CASE lower(regexp_replace(trim("primaryPlatform"), '[ _]+', '-', 'g'))
  WHEN 'vs-code' THEN 'vscode'
  WHEN 'claudecode' THEN 'claude-code'
  WHEN 'geminicli' THEN 'gemini-cli'
  ELSE lower(regexp_replace(trim("primaryPlatform"), '[ _]+', '-', 'g'))
END;

INSERT INTO "MarketplacePlatform" ("key", "nameEn", "position")
SELECT DISTINCT community."primaryPlatform", community."primaryPlatform", 1000
FROM "MarketplaceCommunity" community
LEFT JOIN "MarketplacePlatform" platform ON platform."key" = community."primaryPlatform"
WHERE platform."key" IS NULL;

ALTER TABLE "MarketplaceReleaseCompatibility"
ADD CONSTRAINT "MarketplaceReleaseCompatibility_platformKey_fkey"
FOREIGN KEY ("platformKey") REFERENCES "MarketplacePlatform"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MarketplaceCommunity"
ADD CONSTRAINT "MarketplaceCommunity_primaryPlatform_fkey"
FOREIGN KEY ("primaryPlatform") REFERENCES "MarketplacePlatform"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "MarketplaceProductCompatibility" (
  "productId" TEXT NOT NULL,
  "platformKey" TEXT NOT NULL,
  CONSTRAINT "MarketplaceProductCompatibility_pkey" PRIMARY KEY ("productId", "platformKey")
);

CREATE INDEX "MarketplaceProductCompatibility_platformKey_productId_idx"
ON "MarketplaceProductCompatibility"("platformKey", "productId");

WITH normalized AS (
  SELECT product."id" AS "productId",
    CASE lower(regexp_replace(trim(value), '[ _]+', '-', 'g'))
      WHEN 'vs-code' THEN 'vscode'
      WHEN 'claudecode' THEN 'claude-code'
      WHEN 'geminicli' THEN 'gemini-cli'
      ELSE lower(regexp_replace(trim(value), '[ _]+', '-', 'g'))
    END AS "platformKey"
  FROM "MarketplaceProduct" product
  CROSS JOIN LATERAL unnest(product."platforms") value
), unknown_platforms AS (
  INSERT INTO "MarketplacePlatform" ("key", "nameEn", "position")
  SELECT DISTINCT normalized."platformKey", normalized."platformKey", 1000
  FROM normalized
  LEFT JOIN "MarketplacePlatform" platform ON platform."key" = normalized."platformKey"
  WHERE platform."key" IS NULL AND normalized."platformKey" <> ''
  ON CONFLICT ("key") DO NOTHING
)
INSERT INTO "MarketplaceProductCompatibility" ("productId", "platformKey")
SELECT DISTINCT "productId", "platformKey"
FROM normalized
WHERE "platformKey" <> '';

UPDATE "MarketplaceProduct" product
SET "platforms" = compatibility.keys
FROM (
  SELECT "productId", array_agg("platformKey" ORDER BY "platformKey") AS keys
  FROM "MarketplaceProductCompatibility"
  GROUP BY "productId"
) compatibility
WHERE compatibility."productId" = product."id";

ALTER TABLE "MarketplaceProductCompatibility"
ADD CONSTRAINT "MarketplaceProductCompatibility_productId_fkey"
FOREIGN KEY ("productId") REFERENCES "MarketplaceProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MarketplaceProductCompatibility"
ADD CONSTRAINT "MarketplaceProductCompatibility_platformKey_fkey"
FOREIGN KEY ("platformKey") REFERENCES "MarketplacePlatform"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
