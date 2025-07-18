// Board.ts
import { _decorator, Component, instantiate, log, Prefab, Tween, tween, Vec3, Node, Input } from 'cc'
const { ccclass, property } = _decorator
import GameConfig from '../constants/GameConfig'
import { Tile } from './Tile/Tile'
import { TilePool } from './TilePool'
import { GAMEKEY } from '../constants/GameKey'
import { Cell } from './Cell'
import { IBoard, Match, Movement } from '../constants/global'
import { Utils } from './Utils'
import AnimationManager from './AnimationManager'
@ccclass('Board')
export default class Board extends Component implements IBoard{
    private canMove = false

    private tileGrid: (Tile | undefined)[][] = []

    private firstSelectedTile: Tile | undefined = undefined
    private secondSelectedTile: Tile | undefined = undefined

    private animationManager!: AnimationManager;

    @property(Prefab)
    private tilePoolPrefab: Prefab | null = null
    private tilePool!: TilePool;
    @property(Prefab)
    private selectorPrefab: Prefab | null = null
    private selectorNode: Node | null = null
    private selectorTween?: Tween<Node>;
    @property(Prefab)
    private cellPrefab: Prefab | null = null
    private cellNode: Node | null = null
    @property(Node)
    private cellLayer: Node | null = null;
    @property(Node)
    private tileLayer: Node | null = null;
    @property(Node)
    private effectLayer: Node | null = null


    __preload(): void {
        if (this.tilePoolPrefab === null) throw new Error('Tile pool prefab is not set')
        if (this.selectorPrefab === null) throw new Error('Selector prefab is not set')
        if (this.cellPrefab === null) throw new Error('Cell prefab is not set')
        if (this.cellLayer === null) throw new Error('CellLayer is not set')
        if (this.tileLayer === null) throw new Error('TileLayer is not set')
        if (this.effectLayer === null) throw new Error('EffectLayer is not set')
    }

    start(): void {
        const node = instantiate(this.tilePoolPrefab) as Node | null
        if (node === null) throw new Error('Failed to instantiate tile pool prefab')
        const tilePool = node.getComponent(TilePool) as TilePool | null
        if (tilePool === null) throw new Error('Failed to get tile pool component')
        this.node.addChild(node);
        this.tilePool = tilePool;

        const sl = instantiate(this.selectorPrefab!)
        sl.active = false
        this.node.addChild(sl)
        this.selectorNode = sl

        this.createBoard()


    }

    private createBoard() {
        this.canMove = true
        this.tileGrid = []

        for (let y = 0; y < GameConfig.GridHeight; y++) {
            this.tileGrid[y] = []
            for (let x = 0; x < GameConfig.GridWidth; x++) {
                const cell = this.createCell(x, y)
                this.tileGrid[y][x] = this.addTile(x, y)
            }
        }

        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined

        this.checkMatches()
    }

    private addTile(x: number, y: number): Tile{
        const tile = this.tilePool.getTile(x, y);
        tile.addOnClickCallback((tile) => this.tileDown(tile))
        this.addHoverEffect(tile)
        this.tileLayer!.addChild(tile.node);
        return tile;
    }

    private addHoverEffect(tile: Tile){
        tile.node.on(Input.EventType.MOUSE_ENTER, () => {
            if (this.canMove) {
            log('scale lên to 1.2 lần')
                tween(tile.node)
                    .to(0.1, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x + 0.1, GAMEKEY.TILE.ORIGINAL.SCALE.y + 0.1, GAMEKEY.TILE.ORIGINAL.SCALE.z) }, { easing: 'sineOut' })
                    .start();
            }
        });

        tile.node.on(Input.EventType.MOUSE_LEAVE, () => {
            // trả về scale gốc
            tween(tile.node)
                .to(0.1, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, GAMEKEY.TILE.ORIGINAL.SCALE.z) }, { easing: 'sineOut' })
                .start();
        });
    }

    private createCell(x: number, y: number): Cell {
        const node = instantiate(this.cellPrefab) as Node | null
        if (node === null) throw new Error('Failed to instantiate cell prefab')
        const cell = node.getComponent(Cell) as Cell | null
        if (cell === null) throw new Error('Failed to get cell component')
        cell.setCellType((x + y)%2 + 1)
        const { x: xPos, y: yPos } = Utils.getTilePosition({ x, y })
        node.setPosition(xPos, yPos)
        this.cellLayer!.addChild(cell.node);
        return cell;
    }

    private tileDown(tile: Tile): void {
        if (this.canMove) {
            if (!this.firstSelectedTile) {
                this.firstSelectedTile = tile
                this.selectorNode!.parent = tile.node;
                this.selectorNode!.setPosition(0, 0, 1)
                this.selectorNode!.active = true
                this.selectorTween = tween(this.selectorNode as Node)
                    .to(0.3, { scale: new Vec3(1.1, 1.1, 1) }, { easing: 'sineInOut' })
                    .to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: 'sineInOut' })
                    .union()
                    .repeatForever()
                    .start();
            } else {
                this.secondSelectedTile = tile

                const firstSelectedTileCoords = Utils.getTileCoords(this.tileGrid, this.firstSelectedTile)
                const secondSelectedTileCoords = Utils.getTileCoords(this.tileGrid, this.secondSelectedTile)

                const dx = Math.abs(firstSelectedTileCoords.x - secondSelectedTileCoords.x)
                const dy = Math.abs(firstSelectedTileCoords.y - secondSelectedTileCoords.y)

                if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
                    this.canMove = false
                    this.swapTiles()
                }
                else {
                    this.selectorNode!.parent = tile.node; 
                    this.firstSelectedTile = tile;
                    this.secondSelectedTile = undefined;
                    
                } 
            }
        }
    }

    private swapTiles(): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const firstSelectedTileCoords = Utils.getTileCoords(this.tileGrid, this.firstSelectedTile)
            const secondSelectedTileCoords = Utils.getTileCoords(this.tileGrid, this.secondSelectedTile)

            

            tween(this.firstSelectedTile.node)
                .to(
                    0.4,
                    {
                        position: new Vec3(
                            this.secondSelectedTile.node.x,
                            this.secondSelectedTile.node.y,
                            this.firstSelectedTile.node.position.z
                        ),
                    },
                    {
                        easing: 'linear',
                    }
                )
                .start()

            tween(this.secondSelectedTile.node)
                .to(
                    0.4,
                    {
                        position: new Vec3(
                            this.firstSelectedTile.node.x,
                            this.firstSelectedTile.node.y,
                            this.secondSelectedTile.node.position.z
                        ),
                    },
                    {
                        easing: 'linear',
                    }
                )
                .call(() => {
                    this.tileGrid[firstSelectedTileCoords.y][firstSelectedTileCoords.x] =
                        this.secondSelectedTile

                    this.tileGrid[secondSelectedTileCoords.y][secondSelectedTileCoords.x] =
                        this.firstSelectedTile
                    this.checkMatches()
                })
                .start()

            this.firstSelectedTile =
                this.tileGrid[firstSelectedTileCoords.y][firstSelectedTileCoords.x]

            this.secondSelectedTile =
                this.tileGrid[secondSelectedTileCoords.y][secondSelectedTileCoords.x]
        }
    }

    private swapTilesBack(): void {
    if (this.firstSelectedTile && this.secondSelectedTile) {
        const firstSelectedTileCoords = Utils.getTileCoords(this.tileGrid, this.firstSelectedTile)
        const secondSelectedTileCoords = Utils.getTileCoords(this.tileGrid, this.secondSelectedTile)

        // Swap back in the grid
        this.tileGrid[firstSelectedTileCoords.y][firstSelectedTileCoords.x] = this.secondSelectedTile
        this.tileGrid[secondSelectedTileCoords.y][secondSelectedTileCoords.x] = this.firstSelectedTile

        // Animate back to original positions
        tween(this.firstSelectedTile.node)
            .to(
                0.4,
                {
                    position: new Vec3(
                        this.secondSelectedTile.node.x,
                        this.secondSelectedTile.node.y,
                        this.firstSelectedTile.node.position.z
                    ),
                },
                {
                    easing: 'linear',
                }
            )
            .start()

        tween(this.secondSelectedTile.node)
            .to(
                0.4,
                {
                    position: new Vec3(
                        this.firstSelectedTile.node.x,
                        this.firstSelectedTile.node.y,
                        this.secondSelectedTile.node.position.z
                    ),
                },
                {
                    easing: 'linear',
                }
            )
            .start()
    }
}

    private checkMatches(): void {
        const matches = this.getMatches(this.tileGrid)
        if (matches.length > 0) {
            this.matchWorking(matches).then(() => {
                this.tileUp()
                this.animateDropAndFill().then(() => {
                    this.checkMatches()
                })
            });
        } else {
            this.swapTilesBack()
            this.tileUp()
            this.canMove = true
        }
    }

    private animateDropAndFill(): Promise<void> {
        const movements: Movement[] = [];
        for (let x = 0; x < GameConfig.GridWidth; x++) {
            for (let y = GameConfig.GridHeight - 1; y >= 0; y--) {
                const tile = this.tileGrid[y][x] as Tile;
                if (this.tileGrid[y][x]) {
                    let destY = y;
                    while (destY < GameConfig.GridHeight - 1 && !this.tileGrid[destY + 1][x]) destY++;
                    if (destY != y){
                        this.tileGrid[destY][x] = tile;
                        this.tileGrid[y][x] = undefined;
                        movements.push({ tile, from: { x, y }, to: { x, y: destY } });
                    }
                }
            }
        }
        for (let x = 0; x < GameConfig.GridWidth; x++) {
            let holeCount = 0;
            for (let y = 0; y < GameConfig.GridHeight; y++) {
                if (!this.tileGrid[y][x]) holeCount++;
            }
            for (let i = 0; i < holeCount; i++) {
                const spawnY = -1 -i;
                const destY  = holeCount - i - 1;
                const tile = this.addTile(x, spawnY);
                this.tileGrid[destY][x] = tile;
                movements.push({ tile, from: { x, y: spawnY }, to: { x, y: destY } });
            }
        }
        return this.animationManager.runAnimations(movements);
    }

    private tileUp(): void {
        // log(this.firstSelectedTile)
        // log(this.secondSelectedTile)
        if (this.firstSelectedTile) {
            this.selectorNode!.active = false;
            if (this.selectorTween) this.selectorTween.stop();
            this.firstSelectedTile.node.setScale(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, GAMEKEY.TILE.ORIGINAL.SCALE.z)
        }
        this.firstSelectedTile = undefined
        this.secondSelectedTile = undefined
    }

    private async removeSpecialTile(tile: Tile): Promise<void> {
        const type = tile.getSpecialType();
        const specialType = type.split('_')[1];
        const explodeAnimation = new Promise<void>(res => {
            tween(tile.node)
            .to(0.15, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x + 0.2, GAMEKEY.TILE.ORIGINAL.SCALE.y + 0.2, 1) }, { easing: 'backOut' })
            .to(0.10, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, 1) }, { easing: 'quadIn' })
            .call(() => {
                res();
            })
            .start();
        });
        switch(specialType){
            case GameConfig.SpecialEffects.HORIZONTAL:
                explodeAnimation
                return this.animationManager.spawnFireBall(true, tile);
            case GameConfig.SpecialEffects.VERTICAL:
                explodeAnimation
                return this.animationManager.spawnFireBall(false, tile);
            case GameConfig.SpecialEffects.BOMB:
                explodeAnimation

                return this.animationManager.bombExplode(tile);
            default:
                if (type == GameConfig.SpecialEffects.RAINBOW){
                    return Promise.resolve();
                }
            }
        return Promise.resolve();
    }

    private getMatches(tileGrid: (Tile | undefined)[][]): Match[] {
        let visited : boolean[][] = [];
        for (let y = 0; y < GameConfig.GridHeight; y++){
            let row = [];
            for (let x = 0; x < GameConfig.GridWidth; x++){
                row.push(false);
            }
            visited.push(row);
        }
        let matches : Match[] = []
        for (let y = 0; y < GameConfig.GridHeight; y++){
            for (let x = 0; x < GameConfig.GridWidth; x++){
                if (visited[y][x]) continue;
                const curTile = this.tileGrid[y][x]!;
                if (!curTile) continue; 
                const match = this.getMatch(curTile);
                const horizontal = match.horizontal;
                const vertical = match.vertical;
                if (horizontal.length >= 3){
                    horizontal.forEach((tile: Tile) => {
                        const {x, y} = Utils.getTileCoords(this.tileGrid, tile);
                        visited[y][x] = true;
                    })
                }
                if (vertical.length >= 3){
                    vertical.forEach((tile: Tile) => {
                        const {x, y} = Utils.getTileCoords(this.tileGrid, tile);
                        visited[y][x] = true;
                    })
                }
                if (horizontal.length >= 3 || vertical.length >= 3)
                    matches.push({horizontal, vertical});
            }
        }
        return matches;

    }

    private getMatch(tile: Tile): Match {
        let hoz = this.checkHorizontalMatch(tile);
        let ver = this.checkVerticalMatch(tile);
        for (let i = 1; i < hoz.length; i++){
            const nextHoz = this.checkHorizontalMatch(hoz[i]);
            const nextVer = this.checkVerticalMatch(hoz[i]);
            if (nextHoz.length + nextVer.length - 1 > hoz.length + ver.length - 1){
                hoz = nextHoz;
                ver = nextVer;
            }
        }
        for (let i = 1; i < ver.length; i++){
            const nextHoz = this.checkHorizontalMatch(ver[i]);
            const nextVer = this.checkVerticalMatch(ver[i]);
            if (nextHoz.length + nextVer.length - 1 > hoz.length + ver.length - 1){
                hoz = nextHoz;
                ver = nextVer;
            }
        }

        return {horizontal: hoz, vertical: ver};
    }

    private checkHorizontalMatch(tile: Tile): Tile[] {
        let v = 0;
        let h = 0;
        const {x, y} = Utils.getTileCoords(this.tileGrid, tile);
        const match : Tile[] = [tile]; 
        let i = x - 1;
        while (i >= 0 && this.tileGrid[y][i] && this.tileGrid[y][i]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[y][i]!);
            i--;
        }
        i = x + 1;
        while (i < GameConfig.GridWidth && this.tileGrid[y][i] && this.tileGrid[y][i]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[y][i]!);
            i++;
        }
        return match.length >= 3 ? match : [];
    }

    private checkVerticalMatch(tile: Tile): Tile[] {
        const {x, y} = Utils.getTileCoords(this.tileGrid, tile);
        const match : Tile[] = [tile]; 
        let i = y - 1;
        while (i >= 0 && this.tileGrid[i][x] && this.tileGrid[i][x]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[i][x]!);
            i--;
        }
        i = y + 1;
        while (i < GameConfig.GridHeight &&  this.tileGrid[i][x] && this.tileGrid[i][x]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[i][x]!);
            i++;
        }
        return match.length >= 3 ? match : [];
    }

    private async matchWorking(matches: Match[]): Promise<void> {
        // Có chuỗi 5 -> Gom lại thành Trái cầu vồng
        // có cả hàng lẫn cột -> Gom lại thành Bom 3x3
        // Chuỗi 4 -> Gom lại thành Bom dọc/ngang
        // chuỗi 3 nổ bình thường
        const removalPromise: Promise<void>[] = [];
        for (let match of matches){
            const horizontal = match.horizontal;
            const vertical = match.vertical;
            if (horizontal.length == 5 || vertical.length == 5){
                if (horizontal.length >= 3 && vertical.length >= 3) {
                    vertical.shift(); // Tile gốc trùng
                    removalPromise.push(this.match5(horizontal.concat(vertical)));
                }
                else if (horizontal.length == 5){
                    removalPromise.push(this.match5(horizontal));
                }
                else {
                    removalPromise.push(this.match5(vertical));
                }
            }
            else if (horizontal.length >= 3 && vertical.length >= 3){
                vertical.shift(); // Tile gốc trùng
                removalPromise.push(this.match2Row(horizontal.concat(vertical)));
            }
            else if (horizontal.length == 4 || vertical.length == 4){
                if (horizontal.length == 4){
                    removalPromise.push(this.match4(horizontal));
                }
                else {
                    removalPromise.push(this.match4(vertical));
                }
            }
            else {
                if (horizontal.length == 3){
                    removalPromise.push(this.removeTileGroup(horizontal));
                }
                else if (vertical.length == 3){
                    removalPromise.push(this.removeTileGroup(vertical));
                }
            }
        }
        await Promise.all(removalPromise);
    }

    private match5(match: Tile[]): Promise<void> {
        const centerTile = match[0]
        const centerPos  = centerTile.node.getWorldPosition()
        
        const tweens = match.slice(1).map(tile => {
            this.animationManager.spawnFireworkEffect(tile)
            const { x: gx, y: gy } = Utils.getTileCoords(this.tileGrid, tile);
            return new Promise<void>(res => {
                tween(tile.node)
                    .to(0.3, { worldPosition: new Vec3(centerPos.x, centerPos.y, centerPos.z) })
                    .call(() => {
                        this.tilePool.release(tile);
                        this.tileGrid[gy][gx] = undefined;
                        res()
                    })
                    .start()
            });
        })

        return Promise.all(tweens).then(() => {
            centerTile.setSpecialType(GameConfig.SpecialTypes.RAINBOW)
        })
    }

    private match2Row(match: Tile[]): Promise<void> {
        const centerTile = match[0]
        const centerPos  = centerTile.node.getWorldPosition()

        const tweens = match.slice(1).map(tile => {
            this.animationManager.spawnFireworkEffect(tile);
            const { x: gx, y: gy } = Utils.getTileCoords(this.tileGrid, tile);
            return new Promise<void>(resolve => {
                tween(tile.node)
                    .to(0.2, { worldPosition: centerPos })
                    .call(() => {
                        this.tilePool.release(tile)
                        this.tileGrid[gy][gx] = undefined;
                        resolve()
                    })
                    .start()
            });
        })

        return Promise.all(tweens).then(() => {
            let newType = '';
            switch (centerTile.getTileType()){
                case GameConfig.TYPES.RED:
                    newType = GameConfig.SpecialTypes.RED.BOMB
                    break;
                case GameConfig.TYPES.BLUE:
                    newType = GameConfig.SpecialTypes.BLUE.BOMB
                    break;
                case GameConfig.TYPES.ORANGE:
                    newType = GameConfig.SpecialTypes.ORANGE.BOMB
                    break;
                case GameConfig.TYPES.GREEN:
                    newType = GameConfig.SpecialTypes.GREEN.BOMB
                    break;
                case GameConfig.TYPES.PURPLE:
                    newType = GameConfig.SpecialTypes.PURPLE.BOMB
                    break;
                case GameConfig.TYPES.YELLOW:
                    newType = GameConfig.SpecialTypes.YELLOW.BOMB
                    break;
            }
            centerTile.setSpecialType(newType)
        });
    }

    private match4(match: Tile[]): Promise<void> {
        const centerTile = match[0]
        const isHorizontal = match.every(t => Utils.getTileCoords(this.tileGrid, t).y === Utils.getTileCoords(this.tileGrid, centerTile).y)
        const centerPos  = centerTile.node.getWorldPosition()

        const removals = match.slice(1).map(tile => {
            this.animationManager.spawnFireworkEffect(tile);
            const { x: gx, y: gy } = Utils.getTileCoords(this.tileGrid, tile);
            return new Promise<void>(resolve => {
                tween(tile.node)
                    .to(0.2, { worldPosition: centerPos })
                    .call(() => {
                        this.tilePool.release(tile)
                        this.tileGrid[gy][gx] = undefined;
                        resolve()
                    })
                    .start()
            });
        });

        return Promise.all(removals).then(() => {
            let newType = '';
            switch (centerTile.getTileType()){
                case GameConfig.TYPES.RED:
                    newType = isHorizontal ? GameConfig.SpecialTypes.RED.HORIZONTAL : GameConfig.SpecialTypes.RED.VERTICAL
                    break;
                case GameConfig.TYPES.BLUE:
                    newType = isHorizontal ? GameConfig.SpecialTypes.BLUE.HORIZONTAL : GameConfig.SpecialTypes.BLUE.VERTICAL
                    break;
                case GameConfig.TYPES.ORANGE:
                    newType = isHorizontal ? GameConfig.SpecialTypes.ORANGE.HORIZONTAL : GameConfig.SpecialTypes.ORANGE.VERTICAL
                    break;
                case GameConfig.TYPES.GREEN:
                    newType = isHorizontal ? GameConfig.SpecialTypes.GREEN.HORIZONTAL : GameConfig.SpecialTypes.GREEN.VERTICAL
                    break;
                case GameConfig.TYPES.PURPLE:
                    newType = isHorizontal ? GameConfig.SpecialTypes.PURPLE.HORIZONTAL : GameConfig.SpecialTypes.PURPLE.VERTICAL
                    break;
                case GameConfig.TYPES.YELLOW:
                    newType = isHorizontal ? GameConfig.SpecialTypes.YELLOW.HORIZONTAL : GameConfig.SpecialTypes.YELLOW.VERTICAL
                    break;
            }
            centerTile.setSpecialType(newType)
        })
    }

    

    private findHintPair(): [Tile, Tile] | null {
        const dirs = [{x:1,y:0}, {x:0,y:1}, {x:-1,y:0}, {x:0,y:-1}];
        for (let y = 0; y < GameConfig.GridHeight; y++) {
            for (let x = 0; x < GameConfig.GridWidth; x++) {
                const t1 = this.tileGrid[y][x];
                if (!t1) continue;
                for (const d of dirs) {
                    const nx = x + d.x, ny = y + d.y;
                    if (ny < 0 || ny >= GameConfig.GridHeight || nx < 0 || nx >= GameConfig.GridWidth) continue;
                    const t2 = this.tileGrid[ny][nx];
                    if (!t2) continue;
                    [this.tileGrid[y][x], this.tileGrid[ny][nx]] = [t2, t1];
                    const matches = this.getMatches(this.tileGrid);
                    [this.tileGrid[y][x], this.tileGrid[ny][nx]] = [t1, t2];
                    if (matches.length > 0) {
                        return [t1, t2];
                    }
                }
            }
        }
        return null;
    }

    /****************** PUBLIC METHOD *****************/
    public getCanMove(): boolean {
        return this.canMove;
    }

    public showHint(): void {
        const pair = this.findHintPair();
        if (!pair) return;
        const [a, b] = pair;
        
        tween()
            .target(a.node)
            .to(0.3, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x * 1.2, GAMEKEY.TILE.ORIGINAL.SCALE.y * 1.2, 1) })
            .to(0.3, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, GAMEKEY.TILE.ORIGINAL.SCALE.z) })
            .union()
            .repeat(2)
            .start();
        tween(b.node)
            .to(0.3, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x * 1.2, GAMEKEY.TILE.ORIGINAL.SCALE.y * 1.2, 1) })
            .to(0.3, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, GAMEKEY.TILE.ORIGINAL.SCALE.z) })
            .union()
            .repeat(2)
            .start();
    }

    public getTileGrid(): (Tile | undefined)[][]{
        return this.tileGrid;
    }

    public async removeTileGroup(match: Tile[]): Promise<void> {
        for (const tile of match) {
            try {
                const { x, y } = Utils.getTileCoords(this.tileGrid, tile)
                this.animationManager.spawnFireworkEffect(tile)
                await this.removeSpecialTile(tile);
                this.tilePool.release(tile)
                this.tileGrid[y][x] = undefined
            } catch {

            }            
        }
    }

    public getEffectLayer(): Node | null {
        return this.effectLayer;
    }

    public setAnimationManager(animmanager: AnimationManager){
        this.animationManager = animmanager;
    }
}