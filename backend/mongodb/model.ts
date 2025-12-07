import { Schema } from "mongoose";
import mongoose from "mongoose";

const roomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    creater: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    }, 
    player1: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    }, // id of the player1
    player2: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    }, // id of the player2
    board: {
        type: String,
        required: true
    }, // board, length 9 string
    turn: {
        type: Number,
        required: true
    }, // which player can step. 1->player1, 2->player2
    win: {
        type: Number,
        required: true
    }, // 0 is no one win and not full, 1, 2 is which player wins, 3 is full but no win
    createdAt: {
        type: Number,
        required: true
    }
});

const userSchema = new Schema({
    username: { // username created by the user
        type: String,
        required: true
    },
    password: { // password, stored in hashed format
        type: String,
        required: true
    },
    email: {
        type: String,
        default: null
    },
    phone: {
        type: String,
        default: null
    },
    wincount: {
        type: Number,
        default: 0
    },
    losscount: {
        type: Number,
        default: 0
    },
    drawcount: {
        type: Number,
        default: 0
    }
});

export const Room = mongoose.model('Room', roomSchema);
export const User = mongoose.model('User', userSchema);