joint.dia.CommandManager = Backbone.Model.extend({
    defaults: {
        cmdBeforeAdd: null,
        cmdNameRegex: /^(?:add|remove|change:\w+)$/
    },
    PREFIX_LENGTH: 7,
    initialize: function (options) {
        _.bindAll(this, "initBatchCommand", "storeBatchCommand");
        this.graph = options.graph;
        this.reset();
        this.listen()
    },
    listen: function () {
        this.listenTo(this.graph, "all", this.addCommand, this);
        this.listenTo(this.graph, "batch:start", this.initBatchCommand, this);
        this.listenTo(this.graph, "batch:stop", this.storeBatchCommand, this)
    },
    createCommand: function (options) {
        var cmd = {
            action: undefined,
            data: {
                id: undefined,
                type: undefined,
                previous: {},
                next: {}
            },
            batch: options && options.batch
        };
        return cmd
    },
    addCommand: function (cmdName, cell, graph, options) {
        if (!this.get("cmdNameRegex").test(cmdName)) {
            return
        }
        if (typeof this.get("cmdBeforeAdd") == "function" && !this.get("cmdBeforeAdd").apply(this, arguments)) {
            return
        }
        var push = _.bind(function (cmd) {
            this.redoStack = [];
            if (!cmd.batch) {
                this.undoStack.push(cmd);
                this.trigger("add", cmd)
            } else {
                this.lastCmdIndex = Math.max(this.lastCmdIndex, 0);
                this.trigger("batch", cmd)
            }
        }, this);
        var command = undefined;
        if (this.batchCommand) {
            command = this.batchCommand[Math.max(this.lastCmdIndex, 0)];
            if (this.lastCmdIndex >= 0 && (command.data.id !== cell.id || command.action !== cmdName)) {
                command = _.find(this.batchCommand, function (cmd, index) {
                    this.lastCmdIndex = index;
                    return cmd.data.id === cell.id && cmd.action === cmdName
                }, this);
                if (!command) {
                    this.lastCmdIndex = this.batchCommand.push(this.createCommand({
                        batch: true
                    })) - 1;
                    command = _.last(this.batchCommand)
                }
            }
        } else {
            command = this.createCommand();
            command.batch = false
        } if (cmdName === "add" || cmdName === "remove") {
            command.action = cmdName;
            command.data.id = cell.id;
            command.data.type = cell.attributes.type;
            command.data.attributes = _.merge({}, cell.toJSON());
            command.options = options || {};
            return push(command)
        }
        var changedAttribute = cmdName.substr(this.PREFIX_LENGTH);
        if (!command.batch || !command.action) {
            command.action = cmdName;
            command.data.id = cell.id;
            command.data.type = cell.attributes.type;
            command.data.previous[changedAttribute] = _.clone(cell.previous(changedAttribute));
            command.options = options || {}
        }
        command.data.next[changedAttribute] = _.clone(cell.get(changedAttribute));
        return push(command)
    },
    initBatchCommand: function () {
        if (!this.batchCommand) {
            this.batchCommand = [this.createCommand({
                batch: true
            })];
            this.lastCmdIndex = -1;
            this.batchLevel = 0
        } else {
            this.batchLevel++
        }
    },
    storeBatchCommand: function () {
        if (this.batchCommand && this.batchLevel <= 0) {
            if (this.lastCmdIndex >= 0) {
                this.redoStack = [];
                this.undoStack.push(this.batchCommand);
                this.trigger("add", this.batchCommand)
            }
            delete this.batchCommand;
            delete this.lastCmdIndex;
            delete this.batchLevel
        } else if (this.batchCommand && this.batchLevel > 0) {
            this.batchLevel--
        }
    },
    revertCommand: function (command) {
        this.stopListening();
        var batchCommand;
        if (_.isArray(command)) {
            batchCommand = command
        } else {
            batchCommand = [command]
        }
        for (var i = batchCommand.length - 1; i >= 0; i--) {
            var cmd = batchCommand[i],
                cell = this.graph.getCell(cmd.data.id);
            switch (cmd.action) {
            case "add":
                cell.remove();
                break;
            case "remove":
                this.graph.addCell(cmd.data.attributes);
                break;
            default:
                var attribute = cmd.action.substr(this.PREFIX_LENGTH);
                cell.set(attribute, cmd.data.previous[attribute]);
                break
            }
        }
        this.listen()
    },
    applyCommand: function (command) {
        this.stopListening();
        var batchCommand;
        if (_.isArray(command)) {
            batchCommand = command
        } else {
            batchCommand = [command]
        }
        for (var i = 0; i < batchCommand.length; i++) {
            var cmd = batchCommand[i],
                cell = this.graph.getCell(cmd.data.id);
            switch (cmd.action) {
            case "add":
                this.graph.addCell(cmd.data.attributes);
                break;
            case "remove":
                cell.remove();
                break;
            default:
                var attribute = cmd.action.substr(this.PREFIX_LENGTH);
                cell.set(attribute, cmd.data.next[attribute]);
                break
            }
        }
        this.listen()
    },
    undo: function () {
        var command = this.undoStack.pop();
        if (command) {
            this.revertCommand(command);
            this.redoStack.push(command)
        }
    },
    redo: function () {
        var command = this.redoStack.pop();
        if (command) {
            this.applyCommand(command);
            this.undoStack.push(command)
        }
    },
    cancel: function () {
        if (this.hasUndo()) {
            this.revertCommand(this.undoStack.pop());
            this.redoStack = []
        }
    },
    reset: function () {
        this.undoStack = [];
        this.redoStack = []
    },
    hasUndo: function () {
        return this.undoStack.length > 0
    },
    hasRedo: function () {
        return this.redoStack.length > 0
    }
});
