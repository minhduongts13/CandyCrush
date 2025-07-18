// AnimationManager.ts
import { _decorator, Component, instantiate, log, Prefab, Tween, tween, Vec3, Node, Input } from 'cc'
import { IBoard, ITile, Movement } from '../constants/global'
import { Utils } from './Utils'
import { GAMEKEY } from '../constants/GameKey'
import GameConfig from '../constants/GameConfig'
const { ccclass, property } = _decorator

@ccclass('AnimationManager')
export default class AnimationManager extends Component {
    @property(Prefab)
    public fireworkPrefab: Prefab | null = null
    @property(Prefab)
    public fireBallPrefab: Prefab | null = null
    @property(Prefab)
    public bombPrefab: Prefab | null = null;
    private board!: IBoard;

    __preload(): void {
        if (this.fireworkPrefab === null) throw new Error('Firework prefab is not set')
        if (this.fireBallPrefab === null) throw new Error('FireBall prefab is not set')
        if (this.bombPrefab === null) throw new Error('Bomb prefab is not set')
    }

    constructor(board: IBoard){
        super();
        this.board = board;
    }

    public spawnFireworkEffect(tile: ITile) {
        const { x, y } = Utils.getTileCoords(this.board.getTileGrid(), tile)
        const pos = Utils.getTilePosition({ x, y })
        const fxNode = instantiate(this.fireworkPrefab!) as Node
        fxNode!.setPosition(pos.x, pos.y, 0)
        this.board.getEffectLayer()!.addChild(fxNode)
    }

    public async spawnFireBall(isHorizontal: boolean, tile: ITile): Promise<void> {
        const { x: cx, y: cy } = Utils.getTileCoords(this.board.getTileGrid(), tile);
        const startPos = Utils.getTilePosition({ x: cx, y: cy });
        const steps = isHorizontal
            ? GameConfig.GridWidth
            : GameConfig.GridHeight;
        const speed = 0.5 / steps; 

        const dirs = isHorizontal
            ? [ { dx: -1, dy:  0 }, { dx:  1, dy:  0 } ]
            : [ { dx:  0, dy: -1 }, { dx:  0, dy:  1 } ];

        await Promise.all(dirs.map(d => this.shootOne(d.dx, d.dy, tile, steps, speed)));
    }

    public shootOne = async (dx: number, dy: number, tile: ITile, steps: number, speed: number) => {
        const { x: cx, y: cy } = Utils.getTileCoords(this.board.getTileGrid(), tile);
        const startPos = Utils.getTilePosition({ x: cx, y: cy });
        const fb = instantiate(this.fireBallPrefab!) as Node;
        let angle = 0;
        if (dx ===  1 && dy ===  0) angle =   0;   // sang phải
        if (dx === -1 && dy ===  0) angle = 180;   // sang trái
        if (dx ===  0 && dy ===  1) angle = 270;   // xuống
        if (dx ===  0 && dy === -1) angle =  90;   // lên
        fb.setRotationFromEuler(0, 0, angle);
        fb.setPosition(startPos.x, startPos.y, 3);
        this.board.getEffectLayer()!.addChild(fb);

        for (let step = 1; step < steps; step++) {
            const nx = cx + dx * step;
            const ny = cy + dy * step;
            if (nx < 0 || nx >= GameConfig.GridWidth || ny < 0 || ny >= GameConfig.GridHeight) {
                break;
            }
            const nextPos = Utils.getTilePosition({ x: nx, y: ny });
            await new Promise<void>(resolve => {
                tween(fb)
                .to(speed, { position: new Vec3(nextPos.x, nextPos.y, 0) })
                .call(() => resolve())
                .start();
            });
            const t = this.board.getTileGrid()[ny][nx];
            if (t) {
                this.board.removeTileGroup([t]);
            }
        }

        fb.destroy();
    }

    public runAnimations(movements: Movement[]): Promise<void> {
        return new Promise(res => {
            let remaining = movements.length;
            if (remaining === 0) return res();
            for (const mv of movements) {
                const { tile, from, to } = mv;
                const fromPos = Utils.getTilePosition(from);
                const toPos   = Utils.getTilePosition(to);
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

    public bombExplode(tile: ITile){
        const { x, y } = Utils.getTileCoords(this.board.getTileGrid(), tile)
        const pos = Utils.getTilePosition({ x, y })
        const fxNode = instantiate(this.bombPrefab!) as Node
        fxNode!.setPosition(pos.x, pos.y, 0)
        this.board.getEffectLayer()!.addChild(fxNode)
    }

    public setBoard(board: IBoard){
        this.board = board;
    }
}