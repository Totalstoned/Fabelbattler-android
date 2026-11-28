# Boden-/Fassaden-Texturen – entfernt (1.23.8)

Die aus dem Kenney Voxel Pack erzeugten CC0-Mosaike (`stone_grass.png`,
`stone_dirt.png`, `brick_wall.png`, `roof_tiles.png`, `asphalt.png`, zusammen
~5,5 MB) wurden auf User-Wunsch aus der APK entfernt.

Boden, Straßen und Fassaden nutzen jetzt die prozeduralen Fallbacks
(`stoneTexture()`, Materialsfarben). `cc0Texture()` lädt keine PNGs mehr,
sondern liefert nur noch den übergebenen Fallback. Die Originalquellen bleiben
unter `/root/projects/FABELBATTLER/UDownload`, sind aber nicht mehr im Spiel.
