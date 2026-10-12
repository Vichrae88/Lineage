# Lineage 0.5.2 portrait polish

This revision is prepared on `feature/portrait-polish` from the accepted 0.5.1 release. The current GitHub Pages source remains `feature/immersion-economy`; this revision is not deployed.

The older portrait renderer no longer draws hats, circlets, badges, necklaces, crests, clothing patches, artificial hair or facial marks over its paintings. The newer renderer also removes drawn-on scar and gray-hair marks. Original painted clothing and jewelry remain part of the paintings, and the existing formal/Chronicle presentation frames remain available. Facial proportions and family resemblance continue to use the original painted features. Each atlas cell is clipped before transforms, preventing neighboring pictures from bleeding into a portrait.

All illustrated non-lizard Beastfolk—Fox, Wolf, Cat, Owl, Bear, Rabbit and Otter—now have substantial painted head hair, with swept fringes, textured layers, waves and braids. The update covers all 56 adult face variants, the seven legacy adult species portraits, and the seven child species portraits. Hair is painted into the character artwork with the original identity and species features retained. Lizard portraits use their original files, for both adults and children. Other races also use their original paintings.

The upper-right release label reads **v0.5.2** on character creation and during play, including mobile screens and loaded saves. It identifies the application release independently of the save schema, which remains version five. Browser module and stylesheet version tags are also updated to avoid stale code after a later approved publication.

Existing character IDs, portrait recipe IDs, face keys, inherited proportions and historical records remain unchanged when a save loads. Old accessory fields remain accepted in saved recipes for compatibility, but no longer draw decorations. Profiles describe the updated painted hairstyles without regenerating saved character identities. No simulation mechanics, numeric state, randomness or deployment configuration is changed.

## Visual review

- [All eight Beastfolk heritages, adults and children](review-images/0.5.2/beastfolk-ages.png)
- [Sixteen generated Fox characters](review-images/0.5.2/fox-gallery.png)
- [A loaded legacy court, with the overlays removed](review-images/0.5.2/legacy-court.png)
- [Mobile creation screen and the upper-right version](review-images/0.5.2/creation-mobile.png)

All six edited atlases and the rendered galleries were visually inspected. The original art files remain available; lizard and non-Beastfolk render paths explicitly continue to use them. New atlas filenames keep cached older artwork from masking the hair changes.

## Validation

All **131 tests passed**, with none failed or skipped. These include production save migrations, deterministic replay, portrait persistence, family inheritance and multigenerational continuity. The static build passed.

The existing browser workflow and the new portrait-polish browser check passed. The new check verifies release/package agreement and upper-right position on desktop and 360px mobile screens, loaded older saves, absence of drawn-on portrait decorations, adult and child Beastfolk artwork, original lizard artwork, and successful asset loading. It produced no JavaScript errors or missing-art responses.

Run the visual checks with the optional Playwright/Chromium setup described in README:

```sh
node scripts/browser-check.mjs
node scripts/portrait-polish-check.mjs
node scripts/portrait-gallery.mjs
```

Use `LINEAGE_URL` for the local server or built-game address and `LINEAGE_GALLERY_DIR` for an alternate screenshot directory. Publication should follow the user's review; do not change the Pages source or push this revision to a served branch during preparation.
