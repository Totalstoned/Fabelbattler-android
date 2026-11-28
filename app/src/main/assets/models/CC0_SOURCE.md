# CC0-Modelle – entfernt (1.23.8)

Die zuvor eingebundenen Quaternius-CC0-Dateien (`universal_animation.glb`,
`adventurer.glb`, `models/modular/*.glb`, zusammen ~26 MB) wurden auf
User-Wunsch aus der APK entfernt, um die App kleiner zu machen.

Die Wesen werden wieder ausschließlich prozedural aus dem lokalen
Three.js-Build gerendert. `makeUniversalRig()` und `setUniversalClip()` sind
leere Stubs, damit bestehende Aufrufstellen stabil bleiben; es werden keine
GLB-Dateien mehr geladen und `GLTFLoader.js`/`SkeletonUtils.js` sind raus.

Die Originalarchive liegen weiterhin unter `/root/projects/FABELBATTLER/UDownload`,
sind aber nicht mehr Teil des Spiels.
