var _ = require('lodash');
var casper = require('casper').create();
var footprintCMS = 'Powered by ';
var rootPage = 'http://google.fr';
var links = [];

exports.search = function(options, callback) {
    var query = formatQuery(options.keywords, options.escapes, options.cms);

    // Init casper
    casper.start(rootPage, function() {
        this.fill('form[action="/search"]', { q: query }, true);
    });

    casper.then(function() {
        links = links.concat(this.evaluate(getLinks));
        nextPages = this.evaluate(getNextPage);

        nextPages.forEach(function(page, key) {
            casper.thenOpen(rootPage + page.url, function() {
                links = links.concat(this.evaluate(getLinks));
            });
        });
    });

    casper.run(function() {
        callback(null, sanitize(links));
    });
};

/**
 * Format the entire query
 * @param  {Array} keywords List of keywords
 * @param  {Array} escapes  List of escaped words
 * @param  {string} cms     The cms you want to target
 * @return {string}         The query with keywords, escaped words and footprint from the cms targetted
 */
var formatQuery = function(keywords, escapes, cms) {
    var query = '';

    if (cms) {
        query += footprintCMS + capitalizeFirstLetter(cms);
    }

    query += formatKeywords('+', keywords);
    query += formatKeywords('-', escapes);

    return query;
};

/**
 * Format the search
 * @param  {Array} keywords List of keywords
 * @param  {Array} escapes  List of escaped words
 * @return {string}         The search
 */
var formatKeywords = function(prefix, keywords) {
    var formatted = '';
    if (_.isArray(keywords)) {
        keywords.forEach(function(word, key) {
            formatted += ' ' + prefix + '"' + word +'"';
        });
    } else {
        formatted += ' ' + prefix + '"' + keywords +'"';
    }
    return formatted;
};

/**
 * Returns the links
 * @return {Array}     A list of links
 */
var getLinks = function() {
    var links = document.querySelectorAll('h3.r a');
    return Array.prototype.map.call(links, function(e) {
        return { url: e.getAttribute('href') };
    });
};

var getNextPage = function() {
    var nextPage = document.querySelectorAll('td a.fl');
    return Array.prototype.map.call(nextPage, function(e) {
        return { url: e.getAttribute('href') };
    });
};

/**
 * Utility : capitalize the first letter of a string
 * @param  {string} string The string to format
 * @return {string}        The capitalized string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

var sanitize = function(links) {
    links.forEach(function(link, key) {
        links[key].url = link.url.split('%3Fp')[0].split('&')[0];
    });
    return _.uniq(links);
};