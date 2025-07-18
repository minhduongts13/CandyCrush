// GameManager.ts
import { _decorator, Component, director, instantiate, Prefab, tween, Vec3, type Node } from 'cc'
const { ccclass, property } = _decorator
import GameConfig from '../constants/GameConfig'
import Board from './Board'
import { GAMEKEY } from '../constants/GameKey';
import AnimationManager from './AnimationManager';

@ccclass('GameManager')
export default class GameManager extends Component {
    @property(Prefab)
    private boardPrefab : Prefab | null = null;
    @property(Prefab)
    private animationManagerPrefab : Prefab | null = null;
    private board: Board | null = null;
    private animationManager!: AnimationManager;

    private timeSinceLastMove = 0;

    protected start(): void {
        const node = instantiate(this.boardPrefab) as Node | null
        
        if (node === null) throw new Error('Failed to instantiate tile prefab')
        
        const board = node.getComponent(Board) as Board | null
        
        if (board === null) throw new Error('Failed to get tile component')
        this.board = board;
        const canvas = director.getScene()!.getChildByName('Canvas');
        if (canvas) {
            canvas.addChild(node);
        } else {
            this.node.addChild(node);  // fallback
        }

        const nodeAnim = instantiate(this.animationManagerPrefab) as Node | null
        if (nodeAnim === null) throw new Error('Failed to instantiate animation manager prefab')
        const anim = nodeAnim.getComponent(AnimationManager) as AnimationManager | null
        if (anim === null) throw new Error('Failed to get tile component')
        this.animationManager = anim;
        this.animationManager.setBoard(this.board)
        this.board.setAnimationManager(this.animationManager);
    }

    protected update(dt: number) {
        if (this.board!.getCanMove()) {
            this.timeSinceLastMove += dt;
            if (this.timeSinceLastMove >= GAMEKEY.HINT_TIME_OUT) {
                this.timeSinceLastMove = 0;
                this.board!.showHint();
            }
        }
    }
}
