# search 예제
wiki 검색 만들어보기

# 필요 프로그램
- nodejs
- docker, docker-compose  하나 인스톨하면 다 같이 인스톨 됨



# Step1 위키 DB dump떠오기

- 참고 url:  https://mu-star.net/wikidb#dump-namuwiki
``` bash
curl -L -o namuwiki210301.7z https://wikidb.dataserver.xyz/files/namuwiki210301.7z
# 어떻게든 압축해제하기
# wiki json파일 ./data/wiki.json 으로 놓기
```

# Step2 docker-compose up

``` bash
# up docker containers
docker-compose up --build -d
```

# Step3 위키 DB dump mongoDB에 밀어넣기

``` bash
# access wiki-mongo container
docker exec -it wiki-mongo /bin/bash
# mongo mongodb://username:password@localhost:27017
# mongodb import wiki
mongoimport \
  --uri mongodb://username:password@localhost:27017 \
  --db "wiki" \
  --authenticationDatabase admin\
  --type json \
  --drop \
  --file "/opt/data/wiki.json" \
  --jsonArray
```

# Step 4 mongo의  wiki database안녕한지 보기

chrome browser열고 http://localhost:28081 접속해서 wiki database안녕한지 잘 보기. 이것 저것 눌러보기

# Step 5 elasticsearch에 wiki schema 만들어주기

chrome browser열고 kibana(http://localhost:25061) 접속해서, menu => devTools들어가기

``` json
PUT /wiki
{
  "mappings" : {
    "properties" : {
      "host": {
        "type": "keyword"
      },
      "title" : {
        "type" : "text",
        "analyzer" : "korean"
      },
      "text" : {
        "type" : "text",
        "analyzer" : "korean"
      },
      "namespace" : {
        "type" : "integer"
      },
      "logdate" : {
        "type" : "date"
      },
      "@timestamp" : {
        "type" : "date"
      },
      "mongo_id" : {
        "type" : "keyword"
      },
      "raw_id" : {
        "type" : "keyword"
      },
      "@version" : {
        "type" : "integer"
      }
    }
  },
  "settings" : {
    "index" : {
      "refresh_interval" : "1s",
      "number_of_shards" : "1",
      "analysis" : {
        "analyzer" : {
          "korean" : {
            "filter" : [
              "nori_readingform"
            ],
            "type" : "custom",
            "tokenizer" : "nori_user_dict_tokenizer"
          }
        },
        "tokenizer" : {
          "nori_user_dict_tokenizer" : {
            "mode" : "mixed",
            "type" : "nori_tokenizer",
            "user_dictionary_rules" : [
            ]
          }
        }
      },
      "number_of_replicas" : "0"
    }
  }
}
```

혹시 elasticsearch로 요청이 잘 안나간다. 싶으면 ./data/elasticsearch 디렉토리 한번 지워주고 다시
``` bash
docker-compose up --build -d
```
안되면 카톡방에 물어보기 ㅠ. 모래반지 빵야빵야 외치기

# Step6 logstash를 애용해서 mongodb에 있는 내용 elasticsearch로 migration하기

``` bash
docker exec -it wiki-logstash /bin/bash
./bin/logstash -f pipeline/logstash.conf --log.level=info
```

# Step7 질의문을 만들어보자.

``` json
POST /wiki/_search
{
  "size": 100,
  "_source": {
    "excludes": [
      "raw_id",
      "logdate",
      "@version",
      "@timestamp",
      "mongo_id",
      "namespace",
      "host",
      "text"
    ]
  },
  "query": {
    "bool": {
      "must": [
        {
          "multi_match": {
            "query": "당근마켓",
            "fields": ["title^2", "text"]
          }
        }
      ]
    }
  },
  "highlight": {
    "fields": {
      "text": {
        "fragment_size": 150
      },
    }
  }
}

```

# Step8 조금더 고급적인 질의문을 만들어 보자

``` json
POST /wiki/_search
{
  "_source": {
    "excludes": [
      "raw_id",
      "logdate",
      "@version",
      "@timestamp",
      "mongo_id",
      "namespace",
      "host",
      "text"
    ]
  },
  "size": 100,
  "query": {
    "function_score": {
      "query": {
        "bool": {
          "must": [
            {
              "multi_match": {
                "query": "트위치",
                "fields": ["title", "text"],
                "operator": "and"
              }
            }
          ]
        }
      },
      "functions": [
        {
          "filter": {
            "bool": {
              "must": {
                "match": {
                  "title": {
                    "query": "트위치",
                    "operator": "and"
                  }
                }
              }
            }
          },
          "weight": 3
        },
        {
          "filter": {
            "match_phrase": {
              "text": {
                "slop": 1,
                "query": "트위치"
              }
            }
          },
          "weight": 1
        },
        {
          "weight": 1,
          "script_score": {
            "script": {
              "source": "{{painless script로 랭킹 스코어 계산하기}}",
              "lang": "painless",
              "params": {
                "threshold": 0
              }
            }
          }
        }
      ],
      "score_mode": "sum",
      "boost_mode": "replace"
    }
  },
  "highlight": {
    "fields": {
      "text": {
        "fragment_size": 150
      }
    }
  },
  "sort": [
    {
      "_score": {
        "order": "desc"
      }
    },
    {
      "mongo_id": {
        "order": "desc"
      }
    }
  ]
}
```


# mysql에도 데이터를 넣어보자

#### step 1 create database table
``` bash

docker exec -it wiki-mysql /bin/bash
mysql -u user -p
# > (type password) password
# > use wiki
CREATE TABLE wiki(
  id VARCHAR(300),
  host VARCHAR(300),
  namespace INT,
  logdate TIMESTAMP,
  title VARCHAR(300),
  text LONGTEXT,
  full_text LONGTEXT
  PRIMARY KEY(id)
  FULLTEXT KEY full_text (full_text)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;;
```

#### step 2 logstash를 이용해서 mongodb to mysql
``` bash
docker exec -it wiki-logstash /bin/bash
./bin/logstash -f pipeline/logstash.mysql.conf --log.level=info
```