const axios = require("axios");
const Dev = require("../models/Dev");
const parseStringAsArray = require("../utils/parseStringAsArray");
const { findConnections, sendMessage } = require("../websocket")

module.exports = {
    async index(request, response) {
        const devs = await Dev.find();
        
        return response.json(devs);
    },

    async destroy(request, response) {
        const { github_username } = request.params;

        const dev = await Dev.findOne({ github_username });

        if (!dev) {
            return response.json({ message: "Dev não encontrado." });
        } else {
            await Dev.deleteOne({ github_username });
            return response.json({ message: `Dev ${github_username} deletado com sucesso!` });
        }
    },

    async store(request, response) {
        const { github_username, techs, latitude, longitude } = request.body;

        // Busca um dev com o github_username digitado
        let dev = await Dev.findOne({ github_username });

        // Se não existir ninguem com aquele github_username, cria usuário novo e adiciona ao BD
        if (!dev) {
            const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

            const { name = login, avatar_url, bio } = apiResponse.data;
    
            // Sepera a String onde tem "," em um array e usa o trim para tirar os espaços
            const techsArray = parseStringAsArray(techs);
    
            const location = {
                type: "Point",
                coordinates: [longitude, latitude],
            };
    
            // Pegando todas as informações que o front envia e cadastrando um usuário no BD
            dev = await Dev.create({
                github_username,
                name,
                avatar_url,
                bio,
                techs: techsArray,
                location
            });

            // Filtrar as conexões que estão há no máximo 1km de desitância e que o novo dev tenha pelo menos uma das techs filtradas
            const sendSocketMessageTo = findConnections(
                { latitude, longitude },
                techsArray
            )

            sendMessage(sendSocketMessageTo, "new-dev", dev);
        }

        return response.json(dev);
    },
};