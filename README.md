# LinkClanBot2

A DiscordBot for managing a game's clans, with features such as recording participation time in voice channels, voting, and teaming.

( [The Source code ported from python to javascprit.](https://github.com/link1345/LinkClanBot) )

Features include :

+ VoiceChennel Monitoring
+ MemberList (GoogleSheet)

# Download

``` git clone https://github.com/link1345/LinkClamBot.git ```

# Install

npmのバージョンは、discord.js基準です。
現在は、**npm 16.6** です。

```
npm install -g typescript
npm install
```

# Run

```
npm run build
npm run start
```

* TSでビルドしますが、 danfojs-node が TS1016 を吐いて死ぬので、mode-modulesの中にあるdanfojs-nodeのtypesフォルダを、読み込めないようにリネームすることをお勧めする。

# Config Setting

*.yml-sample と付くファイルの中に
「` **** Configure to your environment. **** `」と
という表記がある欄を、自分の環境に合わせて記入。

その後、`*.yml-sample`と言う名前を、`.yml`に変更し保存。
