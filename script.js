//--------------------------------
//          方塊物件
//--------------------------------

//-----遊戲物件-----
//弄成一組陣列，傳進blockAssign
//selector：選擇器，看他本身有甚麼class
//name：名字
//pitch：音符
var blockdata = [
  { selector: ".block1", name: "1", pitch: "1" },
  { selector: ".block2", name: "2", pitch: "2" },
  { selector: ".block3", name: "3", pitch: "3" },
  { selector: ".block4", name: "4", pitch: "4" }
]

//-----遊戲音效-----
//先讓他做成一個陣列。等等傳進setAssign裡面
var soundsetdata = [
  { name: "correct", sets: [1, 3, 5, 8] },
  { name: "wrong", sets: [2, 4, 5.5, 7] }
]

//-----方塊類別-----
//這個function是方塊的產生器，先給他兩筆資料
//blockAssign：方塊所有的資料
//setAssign：現在撥放遊戲特效（例如成功或失敗的聲音集合）
//d：data(資料)的簡稱   //i：index(順序)的簡稱
var Blocks = function (blockAssign, setAssign) {
  this.allOn = false //是否全部都點亮
  this.blocks = blockAssign.map((d, i) => ({
    name: d.name,
    el: $(d.selector),
    audio: this.getAudioObject(d.pitch)
  }))
  this.soundSets = setAssign.map((d, i) => ({
    name: d.name,
    sets: d.sets.map((pitch) => this.getAudioObject(pitch))
    //把遊戲音效裡面，sets中的每一個pitch，例如[1,3,5,8]他一個一個抓出來，變成getAudioObject的結果
  }))
}

//-----閃爍單一方塊＋聲音(方塊名)-----
//note：音符
Blocks.prototype.flash = function (note) {
  let block = this.blocks.find(d => d.name == note)
  //上面那行表示：回傳d.name有沒有==note，他就會比較每一個有沒有跟傳進來要撥的音符一樣，如果是的話，block就會有值
  if (block) { //當block存在時
    block.audio.currentTime = 0
    block.audio.play()
    block.el.addClass("active") //亮起來
    setTimeout(() => {
      if (this.allOn == false) {
        block.el.removeClass("active") //關掉
      }
    }, 100)
  }
}

//-----方塊全亮-----
//也就是把所有方塊都加上active這個class
Blocks.prototype.turnAllOn = function () {
  this.allOn = true
  this.blocks.forEach((block) => {
    block.el.addClass("active")
  })
}

//-----方塊全暗-----
//也就是把所有方塊都移除active這個class
Blocks.prototype.turnAllOff = function () {
  this.allOn = false
  this.blocks.forEach((block) => {
    block.el.removeClass("active")
  })
}

//-----取得聲音物件-----
Blocks.prototype.getAudioObject = function (pitch) {
  var audio = new Audio("https://awiclass.monoame.com/pianosound/set/" + pitch + ".wav")
  audio.setAttribute("preload", "auto")
  return audio
}

//-----播放聲音的群組（成功/失敗）-----
//這裡的type就是拿來抓是correct或是wrong
Blocks.prototype.playSet = function (type) {
  let sets = this.soundSets.find(set => set.name == type).sets
  //回傳set.name有沒有==type，如果有的話，sets就會有值，後面再加一個點set，也就是找到符合條件的後來播放
  sets.forEach((obj) => {
    obj.currentTime = 0
    obj.play()
  })
}

//-----實體化-----
//把blockdata跟soundsetdata丟進Blocks這個function裡來實體化遊戲跟音效的物件
//丟給遊戲類別的function裡面
//var blocks=new Blocks(blockdata,soundsetdata)

//--------------------------------
//          遊戲物件
//--------------------------------

//-----關卡資料-----
//存幾個字串，就會有幾個關卡
var levelDatas = [
  "123",
  "1232",
  "23123",
  "412334",
  "4132313",
]

//-----遊戲類別-----
//裡面儲存遊戲中需要用到的方塊們
var Game = function () {
  this.blocks = new Blocks(blockdata, soundsetdata)
  //再來定義每個關卡的資料
  this.levels = levelDatas
  //設定：現在的關卡 / 播放時間間隔 / 現在狀態
  this.currentLevel = 0
  this.playInterval = 400
  this.mode = "waiting" //正在等待遊戲開始
}

//-----下載關卡-----
//我要ajax到我的api，取得關卡的資料
// Game.prototype.loadLevels=function(){
//   let _this=this
//   //從url的網址抓JSON資料，當他成功時（success那段），我們就呼叫一個function，這個function就會接回來我的關卡資料，然後我們指定給game的本體
//   $.ajax({
//     url: "https://2017.awiclass.monoame.com/api/demo/memorygame/leveldata",
//     success: function(res){
//       _this.levels=res
//     }
//   })
// }

//-----開始關卡-----
//用在輸入錯誤重新開始的時候
Game.prototype.startLevel = function () {
  this.showMessage(`Level ${this.currentLevel + 1}`)
  let leveldata = this.levels[this.currentLevel]
  this.startGame(leveldata)
}

//-----開始遊戲-----
//就是會先播放標準答案
Game.prototype.startGame = function (answer) {
  this.mode = "gamePlay" //遊戲已經開始了
  this.answer = answer
  let notes = this.answer.split("") //用空字串做分割
  //在關卡開始之後（也就是開始遊戲後)，去呼叫showStatus，傳一個空字串，當作還沒有回答，那因為還沒回答，所以每一個圈圈都還不會有correct的那個class
  this.showStatus("")
  //---每隔一段時間播一個聲音---
  this.timer = setInterval(() => {
    let char = notes.shift() //char是我們每次取出來的數字
    this.playNote(char)
    if (!notes.length) {
      //答案的陣列為空時
      //這裡也可以寫成「notes.length==0」，用「!notes.length」代表如果notes.length是0（是空的）時候，那麼if notes.length就會等於true，因為!可以把1變成0，把0變成1，也就是true
      this.startUserInput()
      clearInterval(this.timer)
    }
  }, this.playInterval)
}

//-----顯示關卡-----
Game.prototype.showMessage = function (mes) {
  console.log(mes)
  $(".status").text(mes)
}

//-----播放音符-----
Game.prototype.playNote = function (note) {
  console.log(note)
  this.blocks.flash(note)
}

//-----使用者可以開始輸入了-----
//-----切換模式-----
Game.prototype.startUserInput = function () {
  //每一次輸入，我們都要有一個變數，來暫存每次使用者的輸入順序
  this.userInput = ""
  //設定一個模式，讓使用者知道可以輸入了
  this.mode = "userInput"
}

//-----取得使用者的輸入並且比對答案-----
//這裡結合了html的block上，新增了onclick事件，這樣點擊block時，就會將值傳來inputChar裡面
Game.prototype.userSendInput = function (inputChar) {
  //要先知道現在是不是使用者可以輸入的模式
  if (this.mode == "userInput") {
    //---取得使用者的輸入---
    //先新增一個新的暫時的字串來儲存，假如現在有123了，當使用者在按下1，新字串這個tempString就會是1231
    let tempString = this.userInput + inputChar
    this.userInput += inputChar
    //按下去的時候播放音符
    this.playNote(inputChar)
    //每次去對圈圈做更新
    this.showStatus(tempString)

    //---比對答案---
    //-答對-//
    if (this.answer.indexOf(tempString) == 0) {
      console.log("good job !")
      enemyBlood()
      enemyColor()
      earnPoints()
      if (this.answer == tempString) {
        this.showMessage("Correct！۹(ÒہÓ)۶")
        this.currentLevel += 1
        this.mode = "waiting" //防止使用者亂按
        setTimeout(() => {
          this.startLevel()
        }, 2000)
      }
      //-答錯-//
    } else {
      console.log("Oh no !")
      characterBlood()
      characterColor()
      losePoints()
      this.showMessage("Wrong！(╯°▽°)╯ ┻━┻")
      // this.currentLevel=0 //從第0關開始
      this.mode = "waiting"
      setTimeout(() => {
        this.startLevel()
      }, 2000)
    }
    console.log(tempString)
  }
}

//-----顯示回答狀態-----
Game.prototype.showStatus = function (tempString) {
  //讓html變成空的，也就是把上一回合的圈圈給清除掉
  $(".inputStatus").html("")
  //根據題目長度來做圈圈數量。
  //用空字串將所有數字給分開，然後用forEach，把每一個都各別抓出來，再去取他的data(d)跟index(i)，執行特定的動作
  //所以有幾個數字就會跑出幾個圈圈
  this.answer.split("").forEach((d, i) => {
    //用jquery的錢字號，裡面放原始碼
    var circle = $("<div class='circle'></div>")
    //當tempString`(這裡的引數)為空的話，也就是給他初始化了，就把全亮的燈給關掉
    //$(".inputStatus").html("")這裡讓html變成空的，也就是把上一回合的圈圈給清除掉，就是初始化的動作
    if (tempString == "") {
      this.blocks.turnAllOff()
    }
    //當答案的index得到的引數小於使用者輸入的長度（tempString.length）時，就要將圓圈變成實心的
    //意思就是使用者開始輸入了
    //輸入後circle就會新增一個correct的class，不過即使輸入錯誤，他也會新增這個class，只差在說，你輸入錯誤的話遊戲就又會重新開始
    if (i < tempString.length) {
      circle.addClass("correct")
    }
    $(".inputStatus").append(circle)
  })
  //再來判斷有沒有全對或者有輸入錯，然後去給予相對顏色
  //紅色：輸入錯誤
  //藍色：輸入正確
  if (tempString == this.answer) {
    $(".inputStatus").addClass("correct")
    //把方塊給亮起來
    setTimeout(() => {
      this.blocks.turnAllOn()
      this.blocks.playSet("correct")
    }, 500)
  } else {
    //先把正確的class拿掉，才不會誤顯示了藍色
    //這是防止使用者雖然沒打錯，但還沒打完就被顯示correct的藍色
    $(".inputStatus").removeClass("correct")
  }

  //假如使用者輸入的答案不在正確答案之中(也就是沒有從第0位就相符合的話)，才加上wrong的class
  if (this.answer.indexOf(tempString) != 0) {
    $(".inputStatus").addClass("wrong")
    //把方塊給亮起來
    setTimeout(() => {
      this.blocks.turnAllOn()
      this.blocks.playSet("wrong")
    }, 500)
  } else {
    //這裡也是防止使用者還沒打完就被顯示wrong的紅色
    $(".inputStatus").removeClass("wrong")
  }
}

var game = new Game()
// game.startGame("1234")
// game.loadLevels()

//設定1秒後遊戲自動開始
// setTimeout(()=>{
//   game.startLevel()
// },1000)

// Game.prototype.clickToStartGame=function(){
//   var percent=0
//   var time=3
//   var _this=this
//   $("button").hide()
//   $(".loadingNone").addClass("loading")
//   $(".barNone").addClass("bar")
//   var timer_count=setInterval(function(){
//     time--
//     if(time<0){
//       clearInterval(timer_count)
//       $(".pageloading").hide()//時間到把資訊看版隱藏起來
//       var timer=setInterval(function(){
//         $(".bar").css("width",percent+"%")
//         percent+=1
//         if(percent>100){
//           clearInterval(timer)
//           setTimeout(_this.startLevel(),500)
//         }
//       },30)}
//    },1000)
// }

Game.prototype.clickToStartGame = function () {
  var percent = 0
  var _this = this
  $("button").hide()
  $(".loadingNone").addClass("loading")
  $(".barNone").addClass("bar")
  var timer = setInterval(function () { //每30毫秒變化一次
    $(".bar").css("width", percent + "%")
    percent += 1
    if (percent > 100) {
      clearInterval(timer)
      setTimeout(() => {
        $(".pageloading").hide()
        _this.startLevel()
      }, 500)
    }
  }, 30)
}

//-----血量調整-----
var enemyHP = 100
var characterHP = 100
var blood_bar_enemy = document.getElementById("blood_bar_enemy")
var blood_bar_character = document.getElementById("blood_bar_character")

//放到比對答案的地方
function enemyBlood() {
  enemyHP = enemyHP - 4 //每次剩餘的血量
  console.log(enemyHP)
  if (enemyHP <= 0) {
    blood_bar_enemy.style.width = "0%"
    EndGame_playerwin()
  } else {
    blood_bar_enemy.style.width = enemyHP + "%"
  }
}
function characterBlood() {
  characterHP = characterHP - 20 //每次剩餘的血量
  console.log(characterHP)
  if (characterHP <= 0) {
    blood_bar_character.style.width = "0%"
    EndGame_playerloss()
  } else {
    blood_bar_character.style.width = characterHP + "%"
  }
}

//-----顏色調整-----
var character_Color = [
  "#76db4b", //0
  "#45c5cc", //1
  "#4a3cb5", //2
  "#6a28b0", //3
  "#564659"  //4
]
var enemy_Color = [
  "#806985", //0
  "#8e7394", //1
  "#a180a8", //2
  "#ad8ab5", //3
  "#be95c7", //4
  "#2b1d91", //5
  "#3021a3", //6
  "#3a2ca8", //7
  "#5a50ad", //8
  "#8e82f5", //9
  "#0da9d9", //10
  "#35b6de", //11
  "#56b4d1", //12
  "#90ccde", //13
  "#8aedeb", //14
  "#1ac96f", //15
  "#51cf8e", //16
  "#75c99e", //17
  "#1bbf26", //18
  "#5fe868", //19
  "#69d10f", //20
  "#a3f55d", //21
  "#bcfa87", //22
  "#e6f59a", //23
  "#FFC429"  //24
]
var c_currentColor = -1
var e_currentColor = -1
var color_character = document.getElementById("color_character")
var color_enemy = document.getElementById("color_enemy")

function characterColor() {
  c_currentColor = c_currentColor + 1
  console.log("now :" + c_currentColor)
  if (c_currentColor > 4) {
    game.startLevel()
  } else {
    color_character.style.backgroundColor = character_Color[c_currentColor]
  }
}
function enemyColor() {
  e_currentColor = e_currentColor + 1
  console.log("now :" + e_currentColor)
  if (e_currentColor > 24) {
    game.startLevel()
  } else {
    color_enemy.style.backgroundColor = enemy_Color[e_currentColor]
  }
}

//-----分數調整-----
var point = 0

function earnPoints() {
  point = point + 10
  $(".score").text(`Score：${point}`)
}
function losePoints() {
  point = point - 10
  $(".score").text(`Score：${point}`)
}

//-----遊戲結束-----
function EndGame_playerwin() {
  localStorage.setItem('GAME_RESULT', point)
  window.location.replace('./result1.html')
}
function EndGame_playerloss() {
  localStorage.setItem('GAME_RESULT', point)
  window.location.replace('./result2.html')
}