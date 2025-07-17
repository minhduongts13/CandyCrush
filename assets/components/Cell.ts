// Cell.ts
import { _decorator, Component, resources, Sprite, SpriteFrame, Vec3, UITransform} from 'cc'
import GameConfig from '../constants/GameConfig'
import { GAMEKEY } from '../constants/GameKey'
const { ccclass, property } = _decorator

@ccclass('Cell')
export class Cell extends Component {
    @property(Sprite)
    private sprite: Sprite | null = null

    protected __preload(): void {
        if (!this.sprite) throw new Error('Sprite is required')
    }

    public setCellType(CellType: number) {
        const spriteFrame = resources.get(`images/square${CellType}/spriteFrame`, SpriteFrame)

        if (!spriteFrame) throw new Error(`Sprite frame for square${CellType} not found`)
        this.sprite!.spriteFrame = spriteFrame
        this.sprite!.node.setScale(new Vec3(GAMEKEY.CELL.ORIGINAL.SCALE.x, GAMEKEY.CELL.ORIGINAL.SCALE.y, GAMEKEY.CELL.ORIGINAL.SCALE.z))
    }
}
