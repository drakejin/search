# search 예제
wiki 검색 만들어보기

# Step1 위키 DB dump떠오기

- 참고 url:  https://mu-star.net/wikidb#dump-namuwiki
``` bash
curl -L -o namuwiki210301.7z https://wikidb.dataserver.xyz/files/namuwiki210301.7z
# 어떻게든 압축해제하기
# wiki json파일 ./data/wiki.json 으로 놓기

# rise up docker containers
docker-compose up --build -d

# access wiki-mongo container
docker exec -it wiki-mongo /bin/bash

mongo

use admin
db.createUser({
  user: "user",
  pwd: "pass",
  roles: ["root"],
  mechanisms: ["SCRAM-SHA-256"]
})

db.system.users.update(
  { _id: "admin.user", "db": "admin" },
  {
    $addToSet: {
      authenticationRestrictions: { clientSource: ["0.0.0.0"] }
    }
  }
)

# mongodb import wiki
mongoimport \
  --uri mongodb://user:pass@0.0.0.0:27017 \
  --authenticationDatabase=wiki \
  --db "admin" \
  --collection "admin" \
  --type json \
  --drop \
  --file "/opt/data/wiki.json" \
  --jsonArray
```



