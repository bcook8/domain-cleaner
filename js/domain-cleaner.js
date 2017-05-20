var DomainCleaner = (function() {

	var _DOMAIN_NAME_REG_EXP_PATTERN = "\\b((?=[a-z0-9-]{1,63}\\.)(((xn--)?[a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,63}))\\b",
			_URL_TLDS_ALPHA_BY_DOMAIN = "./tlds-alpha-by-domain.txt";

  var _validTLDs = [],
			_validTLDsHash = {};

	// Sub class that provides all the statistics on a list of domain names
	var Statistics = function(domainsFound) {
	  this._domainNamesFoundRaw = domainsFound;
		this._domainTLDHashCounts = null;
		this._domainNameCountsList = null;
	}

	Statistics.prototype = function() {
	  var getDomainTLDHashCounts = function(){
			var result;

			if(this._domainTLDHashCounts) return this._domainTLDHashCounts;

			result = {};

			this._domainNamesFoundRaw.forEach(function(name, i){
				var tldResult = _getTLDFromDomain(name), k, v;

				if(tldResult){
					console.log(tldResult)
					k = tldResult;
					v = result[k];
					result[k] = typeof v === "undefined" ? 1 : v + 1;
				} else {
					console.log( 'TLD not found on "' + name + '" at [' + i + '] of _domainNamesFoundRaw.')
				}
			});

			return this._domainTLDHashCounts = result;
		};

		var getDomainNameCountsList = function(){
			var result;
			if(this._domainNameCountsList) return this._domainNameCountsList;

			result = this._domainNamesFoundRaw.reduce(function(hash, currName, i){
				hash[currName] = typeof hash[currName] === "undefined"
					? { name: currName, count: 1 }
					: { name: currName, count: hash[currName].count + 1};

				return hash;
			}, {})

			return this._domainNameCountsList = Object.keys(result).map(function(name){
				return result[name];
			});
		};

		var getDuplicateDomainNameCountsList = function(){
			return this.getDomainNameCountsList().filter(function(domain){
				return domain.count > 1;
			});
		};

		var getDomains = function(){
			return this._domainNamesFoundRaw;
		};

		var getUniqueDomains = function(){
			return Object.keys(this._domainNamesFoundRaw.reduce(function(hash, domain){
				hash[domain] = true;
				return hash;
			}, {}));
		}

	  return {
			getDomains: getDomains,
			getUniqueDomains: getUniqueDomains,
			getDomainTLDHashCounts: getDomainTLDHashCounts,
			getDomainNameCountsList: getDomainNameCountsList,
			getDuplicateDomainNameCountsList: getDuplicateDomainNameCountsList
	  }
	}();

  var _tldsAlphaByDomainResponseHandler = function(clientInstance, resolver, rejecter){
    if (clientInstance.readyState === clientInstance.DONE) {
      if (clientInstance.status === 200) { resolver(clientInstance.response); }
      else { rejecter(clientInstance); }
    }
  }

  var _getTLDsAsync = function(){
    return new RSVP.Promise(function(resolve, reject){
      var client = new XMLHttpRequest();
      client.open("GET", _URL_TLDS_ALPHA_BY_DOMAIN);
      client.onreadystatechange = function(){ _tldsAlphaByDomainResponseHandler(this, resolve, reject) };
      client.responseType = "text";
      client.setRequestHeader("Accept", "text/plain");
      client.send();
    });
  };

  var _getInstanceAsync = function(){
    return new RSVP.Promise(function(resolve, reject){
      resolve(_export);
    });
  };

	var _getTLDFromDomain = function(str){
		return str.substring(str.lastIndexOf('.') + 1);
	};

	var _hasValidTLD = function(domain){
		return !! _validTLDsHash[_getTLDFromDomain(domain)];
	};

  var parse = function(text){
		var domainNameRegEx = new RegExp(_DOMAIN_NAME_REG_EXP_PATTERN, 'g'),
				strMatches = [],
				currExecResult;

		var a = 0;
		var b = 0;
		text = text.toLowerCase();

		while ((currExecResult = domainNameRegEx.exec(text)) !== null){
			a++;
			if(_hasValidTLD(currExecResult[0])){
				b++
				strMatches.push(currExecResult[0]);
			} else {
				console.log('tld check failed for: ' + currExecResult[0]);
			}
		}

		console.log("passed domain check: " + a, "passed tld check: " + b);
		return new Statistics(strMatches);
  }

  // Exposed functionality
  var _export = {
    getValidTLDs: function(){ return _validTLDs; },
    parse: parse
  };

  return {
    init: function(){
      return _getTLDsAsync()
        .then(function(tldListText){
					var tldPatternLiteralSection;

          _validTLDs = tldListText
						.toLowerCase()
						.split("\n")
						.filter(function(s){ return s !== ""; });

					_validTLDs.forEach(function(tld){
						_validTLDsHash[tld] = true;
					});

          return _getInstanceAsync();
        }).catch(function(error){
          console.log("Error loading TLD list. Please make sure that  _URL_TLDS_ALPHA_BY_DOMAIN is correct in domain-cleaner.js.", error);
        });;
    }
  };
})();
