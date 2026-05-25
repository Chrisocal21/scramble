# Tilemaps

Put Tiled JSON exports in this folder.

## File naming convention

```
world1-level1.json
world1-level2.json
world1-boss.json
world2-level1.json
```

## How to export from Tiled

1. File > Export As > JSON map files
2. Save to this folder using the naming convention above
3. In GameScene, load with:
   ```js
   this.load.tilemapTiledJSON('world1-level1', 'assets/tilemaps/world1-level1.json');
   ```
   Then in create():
   ```js
   const level = this.level_loader.load('world1-level1');
   ```
