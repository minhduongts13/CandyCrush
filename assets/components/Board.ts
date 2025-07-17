// Board.ts
import { _decorator, Component, instantiate, log, Prefab, Tween, tween, Vec3, Node, Input } from 'cc'
const { ccclass, property } = _decorator
import GameConfig from '../constants/GameConfig'
import { Tile } from './Tile'
import { TilePool } from './TilePool'
import { GAMEKEY } from '../constants/GameKey'
import { Cell } from './Cell'
import { Match, Movement } from '../constants/global'
@ccclass('Board')
export default class Board extends Component {
    private canMove = false

    private tileGrid: (Tile | undefined)[][] = []

    private firstSelectedTile: Tile | undefined = undefined
    private secondSelectedTile: Tile | undefined = undefined

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
    @property(Prefab)
    private fireworkPrefab: Prefab | null = null


    __preload(): void {
        if (this.tilePoolPrefab === null) throw new Error('Tile pool prefab is not set')
        if (this.selectorPrefab === null) throw new Error('Selector prefab is not set')
        if (this.cellPrefab === null) throw new Error('Cell prefab is not set')
        if (this.cellLayer === null) throw new Error('CellLayer is not set')
        if (this.tileLayer === null) throw new Error('TileLayer is not set')
        if (this.fireworkPrefab === null) throw new Error('Firework prefab is not set')
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
        const { x: xPos, y: yPos } = this.getTilePosition({ x, y })
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

                const firstSelectedTileCoords = this.getTileCoords(this.firstSelectedTile)
                const secondSelectedTileCoords = this.getTileCoords(this.secondSelectedTile)

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

    private getTilePosition(coords: { x: number; y: number }): { x: number; y: number } {
        return {
            x:
                (-GameConfig.GridWidth * GameConfig.TileWidth) / 2 +
                GameConfig.TileWidth / 2 +
                coords.x * GameConfig.TileWidth,
            y:
                // Invert y coordinate since game world coordinates are inverted (positive y is up)
                -(
                    (-GameConfig.GridHeight * GameConfig.TileHeight) / 2 +
                    GameConfig.TileHeight / 2 +
                    coords.y * GameConfig.TileHeight
                ),
        }
    }

    private getTileCoords(tile: Tile): { x: number; y: number } {
        for (let y = 0; y < this.tileGrid.length; y++) {
            for (let x = 0; x < this.tileGrid[y].length; x++) {
                if (this.tileGrid[y][x] === tile) {
                    return { x, y }
                }
            }
        }

        throw new Error('Tile not found')
    }

    private swapTiles(): void {
        if (this.firstSelectedTile && this.secondSelectedTile) {
            const firstSelectedTileCoords = this.getTileCoords(this.firstSelectedTile)
            const secondSelectedTileCoords = this.getTileCoords(this.secondSelectedTile)

            

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
        const firstSelectedTileCoords = this.getTileCoords(this.firstSelectedTile)
        const secondSelectedTileCoords = this.getTileCoords(this.secondSelectedTile)

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
            this.matchWorking(matches);
            // this.removeTileGroup(matches)
            this.tileUp()
            this.animateDropAndFill().then(() =>{
                this.checkMatches()
            })
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
        return this.runAnimations(movements);
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

    private removeTileGroup(match: Tile[]): void {
        // const toRemove = new Set<Tile>()
        // for (const group of matches) {
        //     for (const tile of group) {
        //         toRemove.add(tile)
        //     }
        // }
        for (const tile of match) {
            try {
                const { x, y } = this.getTileCoords(tile)
                const pos = this.getTilePosition({ x, y })
                const fxNode = instantiate(this.fireworkPrefab!) as Node
                fxNode!.setPosition(pos.x, pos.y, 0)
                this.effectLayer!.addChild(fxNode)
                this.tilePool.release(tile)
                this.tileGrid[y][x] = undefined
            } catch {

            }            
        }
    }

    private getMatches(tileGrid: (Tile | undefined)[][]): Match[] {
        // let matches: Tile[][] = []
        // let groups: Tile[] = []

        // for (let y = 0; y < tileGrid.length; y++) {
        //     let tempArray = tileGrid[y]
        //     groups = []
        //     for (let x = 0; x < tempArray.length; x++) {
        //         if (x < tempArray.length - 2) {
        //             if (tileGrid[y][x] && tileGrid[y][x + 1] && tileGrid[y][x + 2]) {
        //                 if (
        //                     tileGrid[y][x]!.getTileType() === tileGrid[y][x + 1]!.getTileType() &&
        //                     tileGrid[y][x + 1]!.getTileType() === tileGrid[y][x + 2]!.getTileType()
        //                 ) {
        //                     if (groups.length > 0) {
        //                         if (groups.indexOf(tileGrid[y][x]!) === -1) {
        //                             matches.push(groups)
        //                             groups = []
        //                         }
        //                     }

        //                     if (groups.indexOf(tileGrid[y][x]!) === -1) {
        //                         groups.push(tileGrid[y][x]!)
        //                     }

        //                     if (groups.indexOf(tileGrid[y][x + 1]!) === -1) {
        //                         groups.push(tileGrid[y][x + 1]!)
        //                     }

        //                     if (groups.indexOf(tileGrid[y][x + 2]!) === -1) {
        //                         groups.push(tileGrid[y][x + 2]!)
        //                     }
        //                 }
        //             }
        //         }
        //     }

        //     if (groups.length > 0) {
        //         matches.push(groups)
        //     }
        // }

        // for (let j = 0; j < tileGrid.length; j++) {
        //     const tempArr = tileGrid[j]
        //     groups = []
        //     for (let i = 0; i < tempArr.length; i++) {
        //         if (i < tempArr.length - 2)
        //             if (tileGrid[i][j] && tileGrid[i + 1][j] && tileGrid[i + 2][j]) {
        //                 if (
        //                     tileGrid[i][j]!.getTileType() === tileGrid[i + 1][j]!.getTileType() &&
        //                     tileGrid[i + 1][j]!.getTileType() === tileGrid[i + 2][j]!.getTileType()
        //                 ) {
        //                     if (groups.length > 0) {
        //                         if (groups.indexOf(tileGrid[i][j]!) === -1) {
        //                             matches.push(groups)
        //                             groups = []
        //                         }
        //                     }

        //                     if (groups.indexOf(tileGrid[i][j]!) === -1) {
        //                         groups.push(tileGrid[i][j]!)
        //                     }
        //                     if (groups.indexOf(tileGrid[i + 1][j]!) === -1) {
        //                         groups.push(tileGrid[i + 1][j]!)
        //                     }
        //                     if (groups.indexOf(tileGrid[i + 2][j]!) === -1) {
        //                         groups.push(tileGrid[i + 2][j]!)
        //                     }
        //                 }
        //             }
        //     }
        //     if (groups.length > 0) matches.push(groups)
        // }

        // return matches
        let matches : Match[] = []
        for (let y = 0; y < GameConfig.GridHeight; y++){
            for (let x = 0; x < GameConfig.GridWidth; x++){
                const curTile = this.tileGrid[y][x];
                const horizontal = this.checkHorizontalMatch(curTile!);
                const vertical = this.checkVerticalMatch(curTile!);
                if (horizontal.length > 0 || vertical.length > 0)
                    matches.push({horizontal, vertical});
            }
        }
        return matches;

    }

    private checkHorizontalMatch(tile: Tile): Tile[] {
        const {x, y} = this.getTileCoords(tile);
        const match : Tile[] = [tile]; 
        let i = x - 1;
        while (i >= 0 && this.tileGrid[y][i]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[y][i]!);
            i--;
        }
        i = x + 1;
        while (i < GameConfig.GridWidth && this.tileGrid[y][i]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[y][i]!);
            i++;
        }
        return match;
    }
    private checkVerticalMatch(tile: Tile): Tile[] {
        const {x, y} = this.getTileCoords(tile);
        const match : Tile[] = [tile]; 
        let i = y - 1;
        while (i >= 0 && this.tileGrid[i][x]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[i][x]!);
            i--;
        }
        i = x + 1;
        while (i < GameConfig.GridHeight && this.tileGrid[i][x]?.getTileType() == tile.getTileType()){
            match.push(this.tileGrid[i][x]!);
            i++;
        }
        return match;
    }

    private matchWorking(matches: Match[]): void {
        // Có chuỗi 5 -> Gom lại thành Trái cầu vồng
        // có cả hàng lẫn cột -> Gom lại thành Bom 3x3
        // Chuỗi 4 -> Gom lại thành Bom dọc/ngang
        // chuỗi 3 nổ bình thường
        for (let match of matches){
            const horizontal = match.horizontal;
            const vertical = match.vertical;
            if (horizontal.length == 5 || vertical.length == 5){
                if (horizontal.length >= 3 && vertical.length >= 3)
                    vertical.shift();
                this.removeTileGroup(horizontal);
                this.removeTileGroup(vertical);
            }
            else if (horizontal.length >= 3 && vertical.length >= 3){
                    vertical.shift(); // Tile gốc trùng
                    this.removeTileGroup(horizontal);
                    this.removeTileGroup(vertical);
            }
            else if (horizontal.length == 4 || vertical.length == 4){
                if (horizontal.length == 4){
                    this.removeTileGroup(horizontal);
                }
                else {
                    this.removeTileGroup(vertical);
                }
            }
            else {
                if (horizontal.length == 3){
                    this.removeTileGroup(horizontal);
                }
                else if (vertical.length == 3){
                    this.removeTileGroup(vertical);
                }
            }
        }
    }

    private runAnimations(movements: Movement[]): Promise<void> {
        return new Promise(res => {
            let remaining = movements.length;
            if (remaining === 0) return res();
            for (const mv of movements) {
                const { tile, from, to } = mv;
                const fromPos = this.getTilePosition(from);
                const toPos   = this.getTilePosition(to);
                // tile.node.setPosition(fromPos.x, fromPos.y, 0);
                const deltaY = Math.abs(to.y - from.y);
                const duration = 0.15 * deltaY;  
                tween(tile.node)
                    .to(duration, { position: new Vec3(toPos.x, toPos.y, 0) })
                    .call(() => {
                        tween(tile.node)
                            .to(0.08, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x + 0.2, GAMEKEY.TILE.ORIGINAL.SCALE.y - 0.2, GAMEKEY.TILE.ORIGINAL.SCALE.z) })
                            .to(0.08, { scale: new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, GAMEKEY.TILE.ORIGINAL.SCALE.z) })
                            .call(() => {
                                if (--remaining === 0) {
                                    res();
                                }
                            })
                            .start();
                    })
                    .start();
            }
        });
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
}