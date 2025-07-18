const GameConfig = {
    GridWidth: 8,
    GridHeight: 8,
    TileWidth: 64,
    TileHeight: 64,
    CandyTypes: [
        'blue',
        'green',
        'orange',
        'red',
        'yellow',
        'purple'
    ],
    TYPES: {
        BLUE: 'blue',
        GREEN: 'green',
        ORANGE: 'orange',
        RED: 'red',
        YELLOW: 'yellow',
        PURPLE: 'purple'
    },

    SpecialTypes: {
        BLUE: {
            HORIZONTAL: 'blue_hoz',
            VERTICAL: 'blue_ver',
            BOMB: 'blue_bomb'
        },
        RED: {
            HORIZONTAL: 'red_hoz',
            VERTICAL: 'red_ver',
            BOMB: 'red_bomb'
        },
        GREEN: {
            HORIZONTAL: 'green_hoz',
            VERTICAL: 'green_ver',
            BOMB: 'green_bomb'
        },
        ORANGE: {
            HORIZONTAL: 'orange_hoz',
            VERTICAL: 'orange_ver',
            BOMB: 'orange_bomb'
        },
        PURPLE: {
            HORIZONTAL: 'purple_hoz',
            VERTICAL: 'purple_ver',
            BOMB: 'purple_bomb'
        },
        YELLOW: {
            HORIZONTAL: 'yellow_hoz',
            VERTICAL: 'yellow_ver',
            BOMB: 'yellow_bomb'
        },
        RAINBOW: "rainbow"
    },

    SpecialEffects: {
        HORIZONTAL: 'hoz',
        VERTICAL: 'ver',
        BOMB: 'bomb',
        RAINBOW: 'rainbow'
    },

} as const

export default GameConfig
