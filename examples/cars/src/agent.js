var car = require('./car.js');

function agent(opt, world) {
    this.car = new car(world, {})
    this.options = opt

    this.world = world
    this.frequency = 20
    this.reward = 0
    this.loaded = false

    this.loss = 0
    this.timer = 0
    this.timerFrequency = 60 / this.frequency

    if (this.options.dynamicallyLoaded !== true) {
    	this.init(world.brains.actor.newConfiguration(), null)
    }
    
};

agent.prototype.init = function (actor, critic) {
    var actions = 2
    var temporal = 1
    var states = this.car.sensors.dimensions

    var input = window.neurojs.Agent.getInputDimension(states, actions, temporal)

    this.brain = new window.neurojs.Agent({

        actor: actor,
        critic: critic,

        states: states,
        actions: actions,

        algorithm: 'ddpg',

        temporalWindow: temporal, 

        discount: 0.975, 

        experience: 75e3, 
        // buffer: window.neurojs.Buffers.UniformReplayBuffer,

        learningPerTick: 50, 
        startLearningAt: 1200,

        theta: 0.075, // progressive copy

        alpha: 0.00 // advantage learning

    })

    // this.world.brains.shared.add('actor', this.brain.algorithm.actor)
    this.world.brains.shared.add('critic', this.brain.algorithm.critic)

    this.actions = actions
    this.car.addToWorld()
	this.loaded = true
};

agent.prototype.step = function (dt) {
	if (!this.loaded) {
		return 
	}

    this.timer++

    if (this.timer % this.timerFrequency === 0) {
        this.car.update()

        var vel = this.car.speed.local
        var speed = this.car.speed.velocity

        if (Math.abs(speed) < 0.1) {
            this.reward = -1;
        }
        else if (speed < 0) {
            this.reward = 0;
        }
        else {
            this.reward = Math.min(1/2 * Math.log(1 + Math.abs(speed)), 1.0)
        }

        this.loss = this.brain.learn(this.reward)
        this.action = this.brain.policy(this.car.sensors.data)
        
        this.car.impact = 0
        this.car.step()
    }
    
    if (this.action) {
        this.car.handle(this.action[0], this.action[1])
    }

    return this.timer % this.timerFrequency === 0
};

agent.prototype.draw = function (context) {
};

module.exports = agent;