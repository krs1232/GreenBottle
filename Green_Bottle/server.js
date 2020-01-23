var express = require("express");
var request = require('request');
var jwt = require('jsonwebtoken');
var tokenKey = "fintechAcademy0$1#0@6!";
var auth = require('./lib/auth');
var sessionStorage = require('sessionstorage');
var moment = require('moment');

app = express();
var port = process.env.PORT || 3000;

app.use(express.static(__dirname + '/public'));

app.set('views', __dirname + '/views'); //__dirname현재모듈의 위치
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({extended:false}));


var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : '0000',
  database : 'fin_project',
  // port     : '8889' 
});
 
connection.connect();

app.get('/', function(req, res){
    res.render('index');
})

app.get('/testAuth', auth, function(req,res){ //미들웨어,데이터줄지 결정
    res.json("로그인된 사용자입니다.");
})



app.get('/signup', function(req, res){
    res.render('signup');
})

app.get('/collect', function(req, res) {
    res.render('collect');
  })
app.get('/help', function(req, res) {
  res.render('help');
})

app.get('/accountlist', function(req, res){
	res.render('accountlist')
})

app.get('/remittance', function(req,res){
	res.render('remittance');
})


app.get("/bottleCount", function (req, res) {
  res.render('bottleCount');
});

app.get('/help', function(req, res) {
  res.render('help');
})

app.get('/accountlist', function(req, res){
	res.render('accountlist')
})

app.get('/remittance', function(req,res){
	res.render('remittance');
})


app.get("/bottleCount", function (req, res) {
  res.render('bottleCount');
});
app.get('/authResult',function(req, res){
    var authCode = req.query.code; //검색창 쿼리
    console.log(authCode);
    var option = {
        method : "POST",
        url    : "https://testapi.openbanking.or.kr/oauth/2.0/token",
        headers: "",
        form   : {
          code : authCode,
          client_id : 'LNBP4fRC6v68zHtpW7swCv8J7mWn0wxF0isU3uY2',
          client_secret :'DzLtnbxmd8zvSybtLj6dSVeJAXguPOrKQb9KqV5w',
          redirect_uri : 'http://localhost:3000/authResult',
          grant_type : 'authorization_code'
        }
    }
    request(option,function(error, response, body){
        console.log(body);
        var accessRequestResult = JSON.parse(body);//string으로 온 access_token을 nodejs에서 사용할수있게 오브젝트로바꿈
        res.render('resultChild', {data : accessRequestResult})
    });
})

app.get('/login', function(req, res){
    res.render('login');
})

app.get('/main', function(req, res){
    res.render('main');
})

app.get('/balance', function(req, res){
    console.log(req.query.fin_use_num)
    res.render('balance');
})

app.get('/qrReader', function(req, res){
    res.render('qrReader')
})

app.get('/location', function(req, res){
    res.render('location')
})

//-----기라성님---//
app.get("/bottleCount", function (req, res) {
  res.render('bottleCount');
});

app.get("/qrCode", function (req, res) {
  res.render('qrCode');
});



//--------------------- post 기능 --------------------------//
// 회원가입
app.post('/user', function(req, res) {
  var name = req.body.name;
  var id = req.body.id;
  var password = req.body.password;
  var accessToken = req.body.accessToken;
  var refreshToken = req.body.refreshToken;
  var userseqNo = req.body.userseqNo;
  
  var sql = "INSERT INTO user (uId, uName, uPassword, accessToken, refreshToken, userseqno) VALUES (?, ?, ?, ?, ?, ?);"
  connection.query(sql, [id, name, password, accessToken, refreshToken, userseqNo], function (error, results, fields) {
      if (error) throw error;
      console.log('실행시킬 sql문 : ' + this.sql);
      res.json(1);
    });
})

// 로그인
app.post('/login', function (req, res) {
  var id = req.body.id;
  var password = req.body.password;
  var sql = "SELECT * FROM user WHERE uId = ? ";
  connection.query(sql, [id], function (error, results, fields) {
    if (error) throw error;
    if(results[0].uPassword == password){
      console.log('로그인 성공');
      sessionStorage.setItem('sessionId', id);
      jwt.sign(
        {
          userName : results[0].uName,
          userId : results[0].uId
        },
        tokenKey,
        {
          expiresIn : '90d',
          issuer : 'fintech.admin',
          subject : 'user.login.info'
        },
        function(err, token){
          res.json(token)
        }
      )
    }
    else{
      console.log('비밀번호 틀렸습니다.');
      res.json(0);
    }    
  });
})

// 회수목록
app.post('/collect', auth, function (req, res) {
  var userData = req.decoded;
  var sql = "SELECT * FROM transaction WHERE user_Id = ? ORDER BY tId desc"
  connection.query(sql, [userData.userId], function(error, results, fields) {
    if (error) throw error;
    else {
      console.log(results);
      res.json(results);
    }
  })
})

// 마지막 거래
app.post('/lasttran', auth, function (req, res) {
  var userData = req.decoded;
  var sql = "SELECT * FROM transaction WHERE user_Id = ? ORDER BY tId desc"
  connection.query(sql, [userData.userId], function(error, results, fields) {
    if (error) throw error;
    else {
      console.log(results);
      res.json(results);
    }
  })
})

//계좌목록가져오기
app.post('/accountList', auth, function(req, res){
	var userData = req.decoded;
  var sql = "SELECT * FROM user WHERE uId =?"
  console.log(userData.userId);
	connection.query(sql, [userData.userId], function(err, results){
    console.log("accesstoken "+results[0].accessToken);
    console.log(" 유저넘버 "+results[0].userseqno);
		if(err){
			console.error(err);
			throw err;
		}
		else{
			var option = {
			method : "GET",
			url : "https://testapi.openbanking.or.kr/v2.0/account/list",
			headers : {
				//db에서 날아오는 값이라 value 오타나 변수명을 db거랑 맞춰야함!!!!!
				"Authorization" : "Bearer "+results[0].accessToken
			},
			qs : {
				//db에서 날아오는 값이라 value 오타나 변수명을 db거랑 맞춰야함!!!!!
				"user_seq_no" : results[0].userseqno,
				"include_cancel_yn" : 'Y',
				"sort_order" : 'D'
			}
		}
		request(option, function(error, response, body){
			console.log(body);
    	    var parseData = JSON.parse(body);
      		  res.json(parseData);
			})
		}
	})
})


app.post("/qrCode", function(req, res){
  var resultJSON = req.body;
  
  res.json(resultJSON);
      
})

app.post('/balance', auth, function(req, res){
  //auth로 허용된 사용자만 걸러냄
  var userData = req.decoded;
  var finusenum = req.body.fin_use_num;
  var sql = "SELECT * FROM user WHERE uId =?"
  connection.query(sql, [userData.userId], function(err, results){
     if(err){
        console.error(err);
        throw err;
     }
     else{
        var countnum = Math.floor(Math.random() * 1000000000) + 1;
        var transId = "T991606390U" + countnum;
        console.log(" 은행tran :"+transId);
            var option = {
              method : "GET",
              url : "https://testapi.openbanking.or.kr/v2.0/account/balance/fin_num",
              headers : {
                  "Authorization" : "Bearer "+results[0].accessToken
              },
              qs : {
                  bank_tran_id : transId,
                  fintech_use_num : finusenum,
                  tran_dtime : '20200114123055'
              }
            }
        request(option, function(error, response, body){
           console.log(body);
           var parseData = JSON.parse(body);
           res.json(parseData);
        })
     }
  })
})



app.post('/sendMoney', auth, function(req, res){
  //auth로 허용된 사용자만 걸러냄
  var userData = req.decoded;
  var finusenum = req.body.fin_use_num;
  var sql = "SELECT * FROM user WHERE uId =?"
  var countnum = Math.floor(Math.random() * 1000000000) + 1;
  var transId = "T991606390U" + countnum;
  connection.query(sql, [userData.userId], function(err, results){
     if(err)throw err;
     else{
        console.log("들어감","ㅇㅇ")
        var option = {
           method : "POST",
           url : "https://testapi.openbanking.or.kr/v2.0/transfer/deposit/fin_num",
           headers : {
         //입금이체 accessToken만 2-legged라 다른 키를 사용합니다!~
              Authorization : "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJUOTkxNjA2MzkwIiwic2NvcGUiOlsib29iIl0sImlzcyI6Imh0dHBzOi8vd3d3Lm9wZW5iYW5raW5nLm9yLmtyIiwiZXhwIjoxNTg2ODQwMTI4LCJqdGkiOiI2N2EzZTViNC05NjU4LTQ2YjItYThkMS0xMjE0ZWU5MzIxMzcifQ.23TxQD_NHwl5T42PBlSlkShqUPjdpoX8zrIIrLGraIg"
           },
           json : {
           "cntr_account_type": "N",
           "cntr_account_num": "3232994138", 
           "wd_pass_phrase": "NONE", 
           "wd_print_content": "환불금액", 
           "name_check_option": "on", 
           "sub_frnc_name": "하위가맹점", 
           "sub_frnc_num": "123456789012",
           "sub_frnc_business_num": "1234567890", 
           "tran_dtime": "20200110101921", 
           "req_cnt": "1", 
           "req_list": [ { 
             "tran_no": "1", 
             "bank_tran_id": "T991606390U111111184",
             "fintech_use_num": "199160639057881699993296",
             "print_content": "병값", 
             "tran_amt": "500", 
             "req_client_name": "김오픈", 
             "req_client_bank_code": "003", 
             "req_client_account_num": "124578963", 
             "req_client_num": "HONGGILDONG1234", 
             "transfer_purpose": "TR" 
             }
           ]
         }

        }

        request(option, function(error, response, body){
           console.log("내역"+body);
           var resultObject = body;
           console.log("코드 "+resultObject.rsp_code)
           if(resultObject.rsp_code == "A0000"){
              res.json(1);
           } 
           else {
              res.json(resultObject.rsp_code)
           }
        })

     }
  })
});


app.post('/location', function(req, res){

  var title = req.body.title;
  var sql1 = "SELECT sum(tbeer) as tb, sum(tsoju) as ts FROM transaction, reclaimer  WHERE rName= ? and rid=reclaimer_id;";  
  
 
  connection.query(sql1,[title], function(err, result){
      if(err){
      }
      else {
          res.json(result);
          }
  }) 
});

// 병 개수 데이터베이스 저장
// 병 개수 데이터베이스 저장
app.post("/insertBottle", function(req, res) {
  var sessionId  = sessionStorage.getItem('sessionId');
  var sessionRId = sessionStorage.getItem('sessionRId');
  var sojuCount  = req.body.sojuCount;
  var beerCount  = req.body.beerCount;
 
  require('moment-timezone');
  moment.tz.setDefault("Asia/Seoul");
  var date = moment().format('YYYY-MM-DD'); 
  var sql = "INSERT INTO fin_project.transaction (user_Id, reclaimer_Id, tBeer, tSoju, tDate) VALUES(?, ?, ?, ?, ?)";
  
  connection.query(sql,[sessionId, sessionRId, beerCount, sojuCount, date], function(error, results) {
    if (error) throw error;
    res.json(1);
  });

});

// 위치 정보 저장 
app.post("/locationTitle", function(req, res) {
  var locationTitle = req.body.locationTitle;
  locationTitle.trim();
  console.log('locationTitle:' + locationTitle);
  var sql = "SELECT rId FROM fin_project.reclaimer WHERE rName=?;";

  connection.query(sql,[locationTitle], function(error, result) {
    if (error) throw error;
    
    sessionStorage.setItem("sessionRId", result[0].rId);
  });

  res.json(1);
});


app.listen(port);
console.log("Listening on port ", port);