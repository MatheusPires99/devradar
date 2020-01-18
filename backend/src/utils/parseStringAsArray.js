module.exports = function SearchController(arrayAsString) {
    return arrayAsString.split(",").map(tech => tech.trim());
}