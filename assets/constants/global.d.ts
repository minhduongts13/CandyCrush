import { Tile } from "../components/Tile"

export type Movement = {
    tile: Tile,
    from: {
        x : number,
        y : number
    },
    to: {
        x : number,
        y : number
    },

}

export type Match = {
    horizontal : Tile[], 
    vertical : Tile[]
}