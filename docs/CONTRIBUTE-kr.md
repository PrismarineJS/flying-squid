# 기여하기

## 프로젝트의 구조

폴더 구조 :

* app.js: 특정 설정을 지정하고 서버를 실제로 시작합니다.
* dist/ :"컴파일된 "코드가 포함되어 있습니다(콘솔의 현재 디렉토리로 이동하고 이를 생성하기 위해'gulp'을 입력합니다).
* src/: 프로젝트의 소스파일입니다.
* src/index.js: 서버 구현을 포함하고 있습니다.
* src/lib: 플러그인이 사용하는 클래스와 함수들이 포함되어 있습니다.
  * plugins/: 모든 기본 플러그인은 바닐라를 시뮬레이션하기 위해 작성되었습니다.
  * worldGenerations/: 기본 worldGenerations은 포함되어 있지만 플러그인은 독자적인 것을 사용할 수 있습니다.
  
## 플러그인의 구조

```js

// 각 개체는 속성, 이벤트, 메소드 또는 데이터를 개체에 주입하기 때문에 "inject"라고 합니다.

module.exports.server = function(serv) { // 여기에 서버이벤트를 작성하십시오.
  serv.spawnPoint = ...
  serv.on('...', ...)
}

module.exports.entity = function(entity, serv) { // 엔티티가 생성될 때 실행됩니다. 절대 server.on이 실행될 때가 아닙니다.
  entity.health = 10; // 체력 20중의 10
  entity.on('...', ...)
  // serv.on('...', ...) NOOOO
}

module.exports.player = function(player, serv) { // 플레이어는 엔티티 유형이며 추가된 속성 및 기능이 포함된 엔티티입니다.
  player.setXp(100); // 플레이어 엔티티만 갖고있는 속성의 예(다른 엔티티는 갖고있지 않습니다.)
  player.on(',,,', ...);
  // serv.on('...', .– 이렇지 않습니다.
}

```

## 로그 및 이벤트

로깅을 서버의 나머지 부분과 독립적으로 유지하고 사람들이 로깅 이외의 다른 방법으로 반응하게하려면,
로깅은 `log.js`의 메소드와 이벤트를 사용합니다. `log.js`에는 `serv.log(message)`와 `serv.emit('error', err)`이 있습니다.

## 외부 플러그인 만들기

사용할 준비가 되면 npm에 게시 될 새 저장소를 만듭니다. 위와 비슷한 형식 (module.exports.xxxx)을 사용하는 파일 (아마도`index.js`)을 만듭니다.

이제 추가 함수에서는 [api.md] (API.md)에 문서화 된 모든 것을 사용할 수 있습니다.

모듈 fs-flying-horses를 호출하여 npm에 게시했다고 가정 해 보겠습니다.

이제 사람들은 간단히 다음을 입력하여 플러그인을 설치할 수 있습니다.

```npm install fs-flying-horses```

### 플러그인 테스트

귀하의 편의를 위해 플러그인을 /src/plugins에 넣을 수 있습니다. 예는 다음과 같습니다.
- src/plugins/
  - myPluginName/
    - index.js
    - package.json
    - node_modules
      - ...
  - myPluginName2.js (직접 파일은 허용되지만 게시가 불가능하므로 테스트 용으로 만 사용하는 것이 가장 좋습니다)

## 번역

더 나은 한국어 번역을 위해 기여를 해주시면 감사하겠습니다.
We would appreciate it if you could contribute to better Korean translation.

## 결론

이 문서에서는 하나의 파일로 간단한 플러그인을 만드는 방법을 설명했지만 코드를 나눌 수 있습니다.
여러 파일에 여러 가지 기능을 넣고 서로 다른 파일에 넣는 방식으로 만들면, flying-squid을 내부 플러그인 용으로 사용하는 것처럼 됩니다.