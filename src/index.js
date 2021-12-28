const { validateMetadata } = require('/opt/verdaccio/build/lib/utils');
const bodyParser = require('body-parser');

function Plugin(config, pluginOptions) {
  const self = Object.create(Plugin.prototype);

  self._config = config;
  self.permission = self._config.permission;
  self._logger = pluginOptions.logger;
  return self;
}

Plugin.prototype.register_middlewares = function (app, auth) {
  if (!this._config.enabled) {
    return;
  }
  const logger = this._logger;
  const permission = this.permission;
  app.put(
    '/:package/:_rev?/:revision?',
    bodyParser.json({ strict: false, limit: '10mb' }),
    auth.apiJWTmiddleware(),
    function (req, res, next) {
      if (req.headers.referer !== 'publish') {
        return next();
      }
      const packageName = req.params.package;
      if (packageName === '-') {
        return next();
      }
      const metadata = validateMetadata(req.body, packageName);
      const remote = req.remote_user;

      let rejected = false;
      if (permission[packageName] && metadata['dist-tags']) {
        Object.keys(metadata['dist-tags']).forEach((tag) => {
          if (!permission[packageName][tag]) {
            return;
          }

          if (!permission[packageName][tag].includes(remote.name)) {
            logger.info(
              `rejected ${remote.name} from publishing ${tag} tag of ${metadata.name}`
            );
            rejected = true;
          }
        });
      }

      if (rejected) {
        res.status(403).end();
        return;
      }
      next();
    }
  );
};

module.exports = Plugin;
