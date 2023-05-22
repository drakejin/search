## 쉽다 쉬워~ 찾기

해볼 수 있는 것
1. 검색만 따로 관리하는 사람이 있다? 또는, 시간이 많다?
   - SearchServer 라는 컴포넌트를 만들어서 찌르도록 하기
2. 검색만 따로 관리하는 사람이 없다? 또는, 시간이 없다?
   - 직접 ElasticSearch 찔러서 기능 만들기

``` mermaid
flowchart LR
    BusinessServer1[BusinessServer] -- 직접 찔러서 가져오기 --> Elasticsearch1[Elasticsearch]
    BusinessServer2[BusinessServer] -- 검색 담당팀에게 부탁해서 가져오기 --> SearchServer
    SearchServer  --> Elasticsearch2[Elasticsearch]
```


---


## 쉽다 쉬워~ 정렬하기
#### 방법

> X*정확도 + Y*최신성

- `정확도`와 `최신성(현재시간 - 작성시간)` 두 인자에 대해 가중치를 정해서 만든다.
- 공식은 있을 수 있지만, 없다 생각하고 눈때중으로 만들어도 된다.
    - x와 y값은 눈 대중 (사실 나름의 연산이 있지만, 결국 눈 대중)



---



## 쉽다 쉬워~ 정렬하기
#### Trade off

- 정확도는 어느 정도만 있으면 되는 최신순이 중요한 서비스
  - 질의어에 대한 term들간의 매칭 연산은 `or` 연산
- 문서는 엄청나게 많아서 정확한 정보가 중요한 서비스
  - 질의어에 대한 term들간의 매칭 연산은 `and` 연산
  - `정확도`를 결정지을 연산들을 최대한 많이 때려넣는다.


---


## 쉽다 쉬워~ 정렬하기
#### 방법

랭킹은 어떻게 만드냐고..!?

``` http
POST /something_collection/_search
"functions": [
{
  "weight": 1,
  "script_score": {
    "script": {
      "source": "_score * 1000 + (doc.created_at_millis - params.current_timestamp_millis) * 2000",
      "lang": "painless",
      "params": {
        "current_timestamp_millis": 1623931200000
      }
  // 생략
  "sort": [{"_score": {"order": "desc"}},{"id": {"order": "desc"}}]
}

```

