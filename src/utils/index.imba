import {CoreTunnel} from './core'

export var math = Math

export class Tunnel < CoreTunnel
    def constructor name
        super
        @name = name

    def setup
        this.doSomething()
        return self

export def round a
    if a > 2
        Math.round(a)
    else
        "tester"

export def random
    return Math.random()

Element.prototype.setupImba = do
    this.item = Math.random()

