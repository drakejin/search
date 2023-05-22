FROM docker.elastic.co/logstash/logstash:7.17.1

# COPY ./mysql-connector-java-8.0.28.jar /usr/share/logstash/plugins/mysql-connector-java-8.0.28.jar

# logstash 에서 mongodb를 꺼내오는 역할
RUN /usr/share/logstash/bin/logstash-plugin install logstash-input-mongodb
# logstash-input-mongodb 가 logstash-input-sqlite를 필요로 함
RUN /usr/share/logstash/bin/logstash-plugin install logstash-input-sqlite
# logstash에서 elasticsearch로 보내주려고
RUN /usr/share/logstash/bin/logstash-plugin install logstash-output-elasticsearch

# logstash에서 mongodb 에서 mysql로 보내주려고
RUN /usr/share/logstash/bin/logstash-plugin install logstash-output-jdbc