// Tile.ts
import { _decorator, Component, resources, Sprite, SpriteFrame, Vec3, UITransform } from 'cc'
import GameConfig from '../constants/GameConfig'
import { GAMEKEY } from '../constants/GameKey'
const { ccclass, property } = _decorator

@ccclass('Tile')
export class Tile extends Component {
    @property(Sprite)
    private sprite: Sprite | null = null

    private tileType: string = GameConfig.CandyTypes[0]

    private callbacks: Array<(tile: Tile) => void> = []

    protected __preload(): void {
        if (!this.sprite) throw new Error('Sprite is required')
    }

    public addOnClickCallback(callback: (tile: Tile) => void) {
        this.callbacks.push(callback)
    }

    public removeOnClickCallback(callback?: (tile: Tile) => void) {
        if (callback) {
            this.callbacks = this.callbacks.filter((c) => c !== callback)
        } else {
            this.callbacks = []
        }
    }

    /**
     * Referenced by button's click event handler
     * in the editor
     * */
    public emitOnClick() {
        for (const callback of this.callbacks) {
            callback(this)
        }
    }

    public getTileType(): string {
        return this.tileType
    }

    public setTileType(tileType: string) {
        this.tileType = tileType
        const spriteFrame = resources.get(`images/${tileType}/spriteFrame`, SpriteFrame)

        if (!spriteFrame) throw new Error(`Sprite frame for ${tileType} not found`)
        this.sprite!.spriteFrame = spriteFrame
        this.sprite!.node.setScale(new Vec3(GAMEKEY.TILE.ORIGINAL.SCALE.x, GAMEKEY.TILE.ORIGINAL.SCALE.y, GAMEKEY.TILE.ORIGINAL.SCALE.z))
    }

    protected onDestroy(): void {
        this.callbacks = []
    }
}
