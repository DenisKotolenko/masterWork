joint.dia.Validator = Backbone.Model.extend({
    initialize: function (options) {
        this._map = {};
        this._commandManager = options.commandManager;
        this.listenTo(this._commandManager, "add", this._onCommand)
    },
    defaults: {
        cancelInvalid: true
    },
    _onCommand: function (command) {
        return _.isArray(command) ? _.find(command, function (singleCmd) {
            return !this._validateCommand(singleCmd)
        }, this) : this._validateCommand(command)
    },
    _validateCommand: function (command) {
        if (command.options && command.options.validation === false) return true;
        var handoverErr;
        _.each(this._map[command.action], function (route) {
            var i = 0;

            function callbacks(err) {
                var fn = route[i++];
                try {
                    if (fn) {
                        fn(err, command, callbacks)
                    } else {
                        handoverErr = err;
                        return
                    }
                } catch (err) {
                    callbacks(err)
                }
            }
            callbacks(handoverErr)
        });
        if (handoverErr) {
            if (this.get("cancelInvalid")) this._commandManager.cancel();
            this.trigger("invalid", handoverErr);
            return false
        }
        return true
    },
    validate: function (actions) {
        var callbacks = _.rest(arguments);
        _.each(callbacks, function (callback) {
            if (_.isFunction(callback)) return;
            throw new Error(actions + " requires callback functions.")
        });
        _.each(actions.split(" "), function (action) {
            (this._map[action] = this._map[action] || []).push(callbacks)
        }, this);
        return this
    }
});
