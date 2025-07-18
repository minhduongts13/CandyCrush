import { _decorator, Component, Sprite, SpriteFrame, UITransform, Vec3, Node, resources } from 'cc';
import { IMAGES } from '../constants/Images';
const { ccclass, property } = _decorator;

@ccclass('Fireball')
export class Fireball extends Component {
    @property(Sprite)
    private sprite!: Sprite;
    public frames: SpriteFrame[] = [];

    private frameTime = 0;
    private frameIndex = 0;

    protected start(): void {
        this.frames.push(resources.get(`images/${IMAGES.FIREBALL.IMG1}/spriteFrame`, SpriteFrame)!)
        this.frames.push(resources.get(`images/${IMAGES.FIREBALL.IMG2}/spriteFrame`, SpriteFrame)!)
        this.frames.push(resources.get(`images/${IMAGES.FIREBALL.IMG3}/spriteFrame`, SpriteFrame)!)
        this.frames.push(resources.get(`images/${IMAGES.FIREBALL.IMG4}/spriteFrame`, SpriteFrame)!)
        this.frames.push(resources.get(`images/${IMAGES.FIREBALL.IMG5}/spriteFrame`, SpriteFrame)!)
    }
    onLoad() {
        this.sprite = this.getComponent(Sprite)!;
    }

    update(dt: number) {
        this.frameTime += dt;
        const interval = 1 / 10;
        if (this.frameTime >= interval) {
        this.frameTime -= interval;
        this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        this.sprite.spriteFrame = this.frames[this.frameIndex];
        }
    }
}
