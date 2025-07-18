// HorizontalTile.ts
import { _decorator, Component, resources, Sprite, SpriteFrame, Vec3, UITransform, log } from 'cc'
import GameConfig from '../../constants/GameConfig'
import { GAMEKEY } from '../../constants/GameKey'
import { ITile } from '../../constants/global'
import { Tile } from './Tile'
import AnimationManager from '../AnimationManager'
const { ccclass, property } = _decorator

@ccclass('HorizontalTile')
export class HorizontalTile extends Tile implements ITile  {

    public async explode(animationManager: AnimationManager){

    }
}
