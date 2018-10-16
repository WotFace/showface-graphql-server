docker-compose build
docker swarm init
docker stack deploy -c docker-compose.yml showface-graphql-server

exit