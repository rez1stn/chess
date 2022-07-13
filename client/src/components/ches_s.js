import { useEffect,  useState } from 'react'
import React from 'react'
import './ches_s.css'




export default function Ches_s() {
  const[gameStarted,setGameStarted] = useState(true)
  const[turn,setTurn] = useState(true) // чей ход 
  const[state,setState] = useState([{id:0,i:0,j:0},{id:1,i:1,j:1}]) // массив значений каждой клетки 
  const[board,setBoard] = useState(0) // отрисовка верхнего массива
  const[effect,setEffect] =useState(-1) // запуск отрисовки 
  const[color,setColor] = useState('white')
  const[socket,setSocket] = useState([])
  const[messages,setMessage] = useState([])
  const[value,setValue] = useState('')
  
  
 useEffect(() => {
   
    const socket = new WebSocket("https://shielded-fjord-48833.herokuapp.com/")
    setSocket(socket)
    socket.onopen =()=>{
    console.log('подключение на клиенте')
    socket.send(JSON.stringify({
      method: 'connection',
      id: window.location.pathname,
    }))
    }
    socket.onclose = ()=>{
      socket.send(JSON.stringify({
        method: 'disconnect',
        color:color
      }))
    }
  socket.onmessage = (event) => {
    let response = JSON.parse(event.data)
    switch(response.method){
      case 'setColor': 
        console.log(response.color)
        setColor(response.color)
       break;
       
      case 'turn': 
        setTurn(response.turn)
        console.log('state.turn', turn)
        console.log(response.turn)
        setState(response.payload)
        setEffect(prevEffect =>{
        return{...prevEffect,...prevEffect+1}})
        break;
      case 'limit':
          console.log('Упс, кажется партия уже началась')
          break;
      case 'messages':
        if(response.payload!=''){
          setMessage(prev=>[response,...prev])
        }
        
    }
    
  
    
  }
 },[])




  class Figure{
    constructor(name,id,i,j,color){
      this.name = name
      this.id = id
      this.i = i
      this.j = j
      this.color = color
    }
  }

  
  let table = []
  let id = -1 
  function startGame(){
    setGameStarted(false)
    for(let i = 1;i<9;i++){
      for(let j = 1;j<9;j++){
        id +=1
        if (i===2){
          let pawn = new Figure('pawn',id,i,j,false)
          table.push(pawn)
        }
        else if(i===7){
          let pawn = new Figure('pawn',id,i,j,true)
          table.push(pawn)
        }
        else if((i===1 && j===1) || (i===1 && j===8) ){
          let rook = new Figure('rook',id,i,j,false)
          table.push(rook)
        }
        else if((i===1 && j===2) || (i===1 && j===7) ){
          let knight = new Figure('knight',id,i,j,false)
          table.push(knight)
        }
        else if((i===1 && j===3) || (i===1 && j===6) ){
          let bishop = new Figure('bishop',id,i,j,false)
          table.push(bishop) 
        }
        else if((i===1 && j===4)){
          let queen = new Figure('queen',id,i,j,false)
          table.push(queen)
        }
        else if((i===1 && j===5)){
          let king = new Figure('king',id,i,j,false)
          table.push(king) 
          localStorage.setItem('blackKingId', 4)
        }
          
        else if((i===8 && j===1) || (i===8 && j===8) ){
          let rook = new Figure('rook',id,i,j,true)
          table.push(rook)
        }
        else if((i===8 && j===2) || (i===8 && j===7) ){
          let knight = new Figure('knight',id,i,j,true)
          table.push(knight)
        }
        else if((i===8 && j===3) || (i===8 && j===6) ){
          let bishop = new Figure('bishop',id,i,j,true)
          table.push(bishop) 
        }
        else if(i===8 && j===5){
          let king = new Figure('king',id,i,j,true)
          table.push(king)
          localStorage.setItem(  'whiteKingId',60)
        }
        else if((i===8 && j===4)){
          let queen = new Figure('queen',id,i,j,true)
          table.push(queen)
        }else{
          table.push({i:i,j:j,id:id})
        }
      }
   
    }
    
    setState(table)
    setEffect(prevEffect =>{
      return{...prevEffect,...prevEffect+1}
    })
    
    
    
  }
  useEffect(()=>{
    
     let drawTable = state.map((figure)=>{
      if(figure.name){
        if(color == 'white'){
          switch(figure.color){
            case true: 
              return(<div id ={figure.id} key ={figure.id} className={figure.name+figure.color} onClick={(e)=>figureClick(e)}></div>)
            case false: 
              return(<div id ={figure.id} key ={figure.id} className={figure.name+figure.color} onClick={(e)=>figureClick(e)}></div>)
        }}else{
          const classes = `${figure.name+figure.color} rot`
          switch(figure.color){
            case true: 
              return(<div id ={figure.id} key ={figure.id} className={classes} onClick={(e)=>figureClick(e)}></div>)
            case false: 
              return(<div id ={figure.id} key ={figure.id} className={classes} onClick={(e)=>figureClick(e)}></div>)

        }}
      }
      else{
        return(<div id={figure.id} key={figure.id} className='cell' onClick={(e)=>cellClick(e)}></div>)
      }
    })
    
    table = state
    setBoard(drawTable)
  },[effect]) 



  let check = []
  let currentMoves = []
  let currentEat = [] 
  let current = new Figure(0,0,0,0,0)  // Фигура игрока,чей ход 
  let currentOp = new Figure(0,0,0,0,0) // Фигура оппонента , сделано для того чтобы кушать фигуры 

  
  function figureClick(e){
    if(table[e.target.id].color == turn){ 
      if (current.name=='king' && table[e.target.id].name == 'rook'){ // рокировка проверка
        let kingId = 0
        let rookId = 0
        let castling = false
        let cellsBetween = []
        switch(Number(e.target.id)!=current.id){
          case Number(e.target.id)>current.id:
            cellsBetween = table.slice(current.id+1,e.target.id);
            kingId = current.id+2
            rookId = kingId-1
            break;
          case Number(e.target.id)<current.id:
            cellsBetween = table.slice(Number(e.target.id)+1,current.id);
            kingId = current.id-2
            rookId = kingId+1
            break;
        }
        let attacks =  checkCellsBetween(cellsBetween)                        
        for (let i = 0;i<cellsBetween.length;i++){  
          if(cellsBetween[i].name || attacks.indexOf(cellsBetween[i].id) !== -1 || attacks.indexOf(Number(localStorage.getItem('blackKingId')))!==-1 || attacks.indexOf(Number(localStorage.getItem('whiteKingId')))!==-1){                  
            castling=false
            break;
          }
          else{
            castling = true
          }
        }
        
        
        if(table[e.target.id].move != true && table[current.id].move != true && castling){
          delete table[current.id].name
          delete table[current.id].color
          delete table[e.target.id].name
          delete table[e.target.id].color
          table[kingId].name = 'king'
          table[kingId].color = turn
          table[rookId].name = 'rook'
          table[rookId].color = turn
          if(current.color){
            localStorage.setItem('whiteKingId',kingId)
          }
          else{
            localStorage.setItem('blackKingId',kingId)
          }
          // setTurn(!turn)
          socket.send(JSON.stringify({
            id: window.location.pathname,
            method: 'turn',
            payload: state,
            turn: !turn
          }))
        }
        
       
      }else{                                                    // если твой ход и ты выбрал свою фигуру она записывается  
      current.name = table[e.target.id].name                   //                      В current в 
      current.id = Number(table[e.target.id].id)           
      current.i= table[e.target.id].i                    //// деструктутризация!!!
      current.j = table[e.target.id].j
      current.color = table[e.target.id].color                        // передаем в функцию проверки текущий массив ,
      check = Check(table[e.target.id],table)
      currentEat = check.eat
      currentMoves = check.move 
      }          
    }else{                                           //       иначе ты выбрал чужую фигруру ,даже если 
      currentOp.name = state[e.target.id].name              // не в свой ход ,это не важно,тк ход произойдет только если                  
      currentOp.id = state[e.target.id].id                   // есть currentMoves и currentEat,которые устанавливаются в if
      currentOp.i= state[e.target.id].i//// деструктутризация!!!
      currentOp.j = state[e.target.id].j
      currentOp.color = state[e.target.id].color 
      if(currentEat.indexOf(currentOp.id)!==-1){    
        let attacks =  letsCheck(Number(e.target.id))                               // угроза своим id после хода   
        if (attacks.indexOf(Number(localStorage.getItem('blackKingId')))!== -1 || attacks.indexOf(Number(localStorage.getItem('whiteKingId')))!== -1 ){  
          console.log('будет шах ')
          if (current.name == 'king' && !current.color){
            localStorage.setItem('blackKingId',current.id) }
          if(current.name == 'king' && current.color){
            localStorage.setItem('whiteKingId',current.id)}       
        } 
        else if (current.name == 'pawn' && ((Number(e.target.id)<=7 && current.color)||(Number(e.target.id)>=56 && !current.color))){
          table[e.target.id].name = 'queen'
          table[e.target.id].color = current.color
          delete table[current.id].name
          delete table[current.id].color
          // setTurn(!turn)
          socket.send(JSON.stringify({
            id: window.location.pathname,
            method: 'turn',
            payload: table,
            turn: !turn
          })) 
          
        } 
        else{
          Go(e.target.id)
        } 
      }
    }
  }
  
// проверить будет ли тебе шах после этого

  function Check(figure,table){          
    let y = figure.i
    let x = figure.j
    let index = figure.id
    //  возможные ходы и нападения пешек  без взятия на проходе и превращения в фигуру
    if(figure.name == 'pawn' && figure.color ){
      let allowEat =[]
      let allowMoves = []
      ///// ВОЗМОЖНЫЕ ХОДЫ БЕЛЫХ  .....
      if ( !('color' in table[figure.id-8])&& y==7){
        allowMoves.push(table[figure.id-8].id)
      }else if(!('color' in table[figure.id-8]) && allowMoves.indexOf(table[figure.id-8].id) == -1){
        allowMoves.push(table[figure.id-8].id)}
      if( figure.id-16>0 && !('color' in table[figure.id-16]) && allowMoves.length == 1 && y==7){
        allowMoves.push(table[figure.id-16].id)
      }
      /////// ВОЗМОЖНЫЕ ПОЕДАНИЯ БЕЛЫХ .....
      if(((figure.id+1)%8)!==0 && (figure.id%8)!==0 && 'color' in table[figure.id-7] &&  table[figure.id-7].color != figure.color){
        allowEat.push(table[figure.id-7].id)
      }
      if(((figure.id+1)%8)!==0 && (figure.id%8)!==0 && 'color' in table[figure.id-9] && table[figure.id-9].color != figure.color ){
        allowEat.push(table[figure.id-9].id)
      }
      if(figure.id%8==0 && 'color' in table[figure.id-7] && table[figure.id-7].color != figure.color ){
        allowEat.push(table[figure.id-7].id)
      }
      if((figure.id+1)%8 ==0  && 'color' in table[figure.id-9] && table[figure.id-9].color != figure.color ){
        allowEat.push(table[figure.id-9].id)
      }
        currentEat = allowEat
        currentMoves = allowMoves
      return({
        eat: currentEat,
        move: currentMoves
      })
        
  
    }else if (figure.name == 'pawn' && !figure.color ){  
      let allowEat =[]
      let allowMoves = []
      /////// ВОЗМОЖНЫЕ ХОДЫ ЧЕРНЫХ
      if ( !('color' in table[figure.id+8])&& y==2){
        allowMoves.push(table[figure.id+8].id)
      }else if(!('color' in table[figure.id+8]) && allowMoves.indexOf(table[figure.id+8].id) == -1){
        allowMoves.push(table[figure.id+8].id)
      }
      if( figure.id+16<64 && !('color' in table[figure.id+16]) && allowMoves.length == 1 && y==2){
        allowMoves.push(table[figure.id+16].id)
      }
      ///// ВОЗМОЖНЫЕ ПОЕДАНИЯ ЧЕРНЫХ
      if(((figure.id+1)%8)!==0 && figure.id%8!==0 &&'color' in table[figure.id+7] && table[figure.id+7].color !== figure.color ){
        allowEat.push(table[figure.id+7].id)
      }
      if( (figure.id+1)%8!==0 && figure.id%8!==0 && 'color' in table[figure.id+9] && table[figure.id+9].color !== figure.color ){
        allowEat.push(table[figure.id+9].id)
      }
      if((figure.id+1)%8 == 0 && 'color' in table[figure.id+7] && table[figure.id+7].color !== figure.color){
        allowEat.push(table[figure.id+7].id)
      }
      if(figure.id%8==0 && 'color' in table[figure.id+9] && table[figure.id+9].color !== figure.color){
        allowEat.push(table[figure.id+9].id)
      }
      currentEat =allowEat
        currentMoves = allowMoves
      return({
        eat: currentEat,
        move: currentMoves
      })
    }                                                    
    
    if(figure.name =='bishop' ){
      let count = 0 // количесвто черных  фигур на пути слона
      let allowEat =[] 
      let allMoves = [] // массив всех ходов без правил для слона ( например не перескакивать через свою фигуру)
      let allowMoves = []// массив ходов с правилами 


      for (let i=0;i<table.length;i++){
        if((y+x == table[i].i+table[i].j || y-x == table[i].i-table[i].j)){                                                       
          allMoves.push(table[i].id)
        }
      }
      while(allMoves.indexOf(index-7) !== -1 && (table[index-7].color==undefined || table[index-7].color == !figure.color) && count !== 1 ){ 
        if (table[index-7].color == !figure.color ){
          allowEat.push(index-7)
          count = count+1
        }else{
          allowMoves.push(index-7)
        }
        index=index-7
      }
      count = 0            // сбрасываем, чтобы зайти в следующий while
      index = figure.id
      while(allMoves.indexOf(index-9) !== -1 && (table[index-9].color==undefined || table[index-9].color == !figure.color) && count !== 1){
        if (table[index-9].color == !figure.color ){
          allowEat.push(index-9)
          count = count+1
        }else{
          allowMoves.push(index-9)
        }
        index=index-9
      }
      count = 0 
      index = figure.id
      while(allMoves.indexOf(index+7) !== -1 && (table[index+7].color==undefined || table[index+7].color == !figure.color) && count !== 1){
        if (table[index+7].color == !figure.color ){
          allowEat.push(index+7)
          count = count+1
        }else{
          allowMoves.push(index+7)
        }
        index=index+7
      }
      count = 0 
      index = figure.id
      while(allMoves.indexOf(index+9) !== -1 && (table[index+9].color==undefined || table[index+9].color == !figure.color)&& count !== 1 ){
        if (table[index+9].color == !figure.color ){
          allowEat.push(index+9)
          count = count+1
        }else{
          allowMoves.push(index+9)
        }
        index=index+9
      }
      count = 0 
      index = figure.id

      currentEat =allowEat
      currentMoves = allowMoves
     
      return({
        eat: currentEat,
        move: currentMoves
      })

    }

    if(figure.name == 'knight'){
      let allowMoves =[]
      let allowEat =[]
    
      for(let i =0;i<table.length;i++){
        if(((Math.abs(table[i].j-x)==1 && Math.abs(table[i].i-y)==2) || 
        (Math.abs(table[i].j-x)==2 && Math.abs(table[i].i-y)==1))){
          if(table[i].color == !figure.color){
            allowEat.push(table[i].id)
          }else{
            allowMoves.push(table[i].id)
          }
        }
      }
      currentEat =allowEat
      currentMoves = allowMoves
      return({
        eat: currentEat,
        move: currentMoves
      })
    }

    if(figure.name == 'rook'){
      let allMoves = []
      let allowMoves =[]
      let allowEat =[]
      let count = 0
      for (let i=0;i<table.length;i++){
        if(((table[i].i == y) || (table[i].j==x))){                                                       
          allMoves.push(table[i].id)
        }
      }
      while(allMoves.indexOf(index-8) !== -1 && (table[index-8].color==undefined || table[index-8].color == !figure.color) && count !== 1 ){ 
        if (table[index-8].color == !figure.color ){
          allowEat.push(index-8)
          count = count+1
        }else{
          allowMoves.push(index-8)
        }
        index=index-8
      }
      count = 0
      index = figure.id
      while(allMoves.indexOf(index-1) !== -1 && (table[index-1].color==undefined || table[index-1].color == !figure.color) && count !== 1 ){ 
        if (table[index-1].color == !figure.color ){
          allowEat.push(index-1)
          count = count+1
        }else{
          allowMoves.push(index-1)
        }
        index=index-1
      }
      count = 0
      index = figure.id
      while(allMoves.indexOf(index+8) !== -1 && (table[index+8].color==undefined || table[index+8].color == !figure.color) && count !== 1 ){ 
        if (table[index+8].color == !figure.color ){
          allowEat.push(index+8)
          count = count+1
        }else{
          allowMoves.push(index+8)
        }
        index=index+8
      }
      count = 0
      index = figure.id
      while(allMoves.indexOf(index+1) !== -1 && (table[index+1].color==undefined || table[index+1].color == !figure.color) && count !== 1 ){ 
        if (table[index+1].color == !figure.color ){
          allowEat.push(index+1)
          count = count+1
        }else{
          allowMoves.push(index+1)
        }
        index=index+1
      }
      count = 0
      index = figure.id

      currentEat =allowEat
      currentMoves = allowMoves
      return({
        eat: currentEat,
        move: currentMoves
      })
    }

    if(figure.name == 'queen'){
      let allowMoves =[]
      let allowEat = []
      let bishop = Check({
        name :'bishop',
        id : figure.id,
        i : figure.i,
        j : figure.j,
        color : figure.color,
      },table)
      let rook = Check({
        name :'rook',
        id : figure.id,
        i : figure.i,
        j : figure.j,
        color : figure.color,
      },table)
      allowMoves = bishop.move.concat(rook.move)
      allowEat = bishop.eat.concat(rook.eat)

      currentEat =allowEat
      currentMoves = allowMoves
      return({
        eat: currentEat,
        move: currentMoves
      })
      

    }

    if(figure.name == 'king'){
      let allowMoves = []
      let allowEat = []
      if((figure.id-8>=0) && !('color' in table[figure.id-8])){
        allowMoves.push(figure.id-8)
      }if((figure.id-7>=0) && !('color' in table[figure.id-7])){
        allowMoves.push(figure.id-7)
      }if((figure.id-9>=0) && !('color' in table[figure.id-9]) ){
        allowMoves.push(figure.id-9)
      }if((figure.id-1>=0) && !('color' in table[figure.id-1]) ){
        allowMoves.push(figure.id-1)
      }if((figure.id+1<=63) &&!('color' in table[figure.id+1]) ){
        allowMoves.push(figure.id+1)
      }if((figure.id+8<=63) && !('color' in table[figure.id+8])){
        allowMoves.push(figure.id+8)
      }if((figure.id+7<=63) && !('color' in table[figure.id+7])){
        allowMoves.push(figure.id+7)
      }if((figure.id+9<=63) && !('color' in table[figure.id+9])){
        allowMoves.push(figure.id+9)
      }if((figure.id-8>=0) && table[figure.id-8].color == !figure.color){
        allowEat.push(figure.id-8)
      }if((figure.id-9>=0) && table[figure.id-9].color == !figure.color){
        allowEat.push(figure.id-9)
      }if((figure.id-7>=0) && table[figure.id-7].color == !figure.color){
        allowEat.push(figure.id-7)
      }if((figure.id-1>=0) && table[figure.id-1].color == !figure.color){
        allowEat.push(figure.id-1)
      }if((figure.id+1<=63) && table[figure.id+1].color == !figure.color){
        allowEat.push(figure.id+1)
      }if((figure.id+7<=63) && table[figure.id+7].color == !figure.color){
        allowEat.push(figure.id+7)
      }if((figure.id+8<=63) && table[figure.id+8].color == !figure.color){
        allowEat.push(figure.id+8)
      }if((figure.id+9<=63) && table[figure.id+9].color == !figure.color){
        allowEat.push(figure.id+9)
      }
      

      currentEat =allowEat
      currentMoves = allowMoves
      return({
        eat: currentEat,
        move: currentMoves
      })
    }
  }
  function letsCheck(id){
    if (current.name == 'king' && current.color){
      localStorage.setItem('whiteKingId',id)
    }
    if(current.name == 'king' && current.color == false ){
      localStorage.setItem('blackKingId',id)
    }
    let futureTable = JSON.parse(JSON.stringify(state))
    let uniqueValues =[]
    let allEatMoves = []
    let eatMoves = []
    futureTable[id].name = current.name                                      
    futureTable[id].color = current.color                               
    delete futureTable[current.id].name
    delete futureTable[current.id].color 
      for (let i=0;i<futureTable.length;i++){
        if(futureTable[i].color == !turn && futureTable[i].color != undefined){
          eatMoves = Check(futureTable[i],futureTable)
          allEatMoves.push(...eatMoves.eat)                              
        }
      }   
    uniqueValues = [...new Set(allEatMoves)]
    return uniqueValues                                               
  }
  function checkCellsBetween(cellsBetween){   // по идее оптимизировать с letsCheck можно
    let uniqueValues =[]
    let allEatMoves = []
    let eatMoves = []
    let futureTable = JSON.parse(JSON.stringify(state))
    for(let i = 0;i<cellsBetween.length;i++){
      futureTable[cellsBetween[i].id].name = 'pawn'
      futureTable[cellsBetween[i].id].color = turn
    }
    for (let i=0;i<futureTable.length;i++){
      if(futureTable[i].color == !turn && futureTable[i].color != undefined){
        eatMoves = Check(futureTable[i],futureTable)
        allEatMoves.push(...eatMoves.eat)                              
      }
    }   
    uniqueValues = [...new Set(allEatMoves)]
    return uniqueValues 
  }
  function Go(id){
    
    table[id].name = current.name
    table[id].color = current.color
    if(table[id].name == 'king' || table[id].name == 'rook'){
      table[id].move = true
    }
    delete table[current.id].name
    delete table[current.id].color

    // setTurn(!turn)
    socket.send(JSON.stringify({
      id: window.location.pathname,
      method: 'turn',
      payload: state,
      turn: !turn
    }))
    
    
  }  
 
  function cellClick(e){
    console.log(e.target.id)
         if(current.color !== 0 && currentMoves.indexOf(Number(e.target.id)) !== -1){     
          let attacks =  letsCheck(Number(e.target.id))                                                                                      // угроза своим id после хода   
          if (attacks.indexOf(Number(localStorage.getItem('blackKingId')))!== -1 || 
          attacks.indexOf(Number(localStorage.getItem('whiteKingId')))!== -1 ){  
            console.log('будет шах ')
            if (current.name == 'king' && current.color == false){
              localStorage.setItem('blackKingId',current.id)
            }
            if(current.name == 'king' && current.color){
              localStorage.setItem('whiteKingId',current.id)
            }    
          }
          else if (current.name == 'pawn' && ((Number(e.target.id)<=7 && current.color)||(Number(e.target.id)>=56 && !current.color))){
            table[e.target.id].name = 'queen'
            table[e.target.id].color = current.color
            delete table[current.id].name
            delete table[current.id].color
            // setTurn(!turn)
            socket.send(JSON.stringify({
              id: window.location.pathname,
              method: 'turn',
              payload: table,
              turn: !turn
            })) 
            
          }
          else{
            
            Go(e.target.id) 
                  // теперь ходишь не ты            
          }
        }        
  }



 function sendMessages(){
  
  socket.send(JSON.stringify({
    id: window.location.pathname,
    method: 'messages',
    payload: value,
    color:color
  }))
  setValue('')
 }
  
  return (
  <div>
    {gameStarted?
    <div className='background'>
      <button className='startBtn' onClick={startGame}>Play</button>
    </div>
    
    
    :
    <div className='container'>
    {color=='white'
    ?                                            
    <div className='wrap'>
      <div className='left'>
        {turn?
          <div className='board  '>{board}</div>
          :
          <div className='board block '>{board}</div>
        } 
      </div>
      <div className='right'>CHAT 
          <div className='messages'>
          {messages.map((message,index)=>{
            return(
              
              <div key={index} className='msg'>{message.color}: {message.payload}</div>
              )
          })}
          </div>
          <div className='inputForm'>
            <input  placeholder='type here' value={value} className='input' onChange={e =>setValue(e.target.value)}></input>
            <button className='btn' onClick={sendMessages}>Send</button>
          </div>
          
    </div>
     
    </div> 

    
    
    : 
    <div className='wrap'>
    {/* <div>ход {turn? 'белых':'черных'}</div> */}
    {/* <div className='rotated'>  */}
    <div className='left'>
    {!turn?
      <div className='board rot center'>{board}</div>
      :
      <div className='board rot block center'>{board}</div>
    }
    </div>
    <div className='right'>CHAT 
          <div className='messages'>
          {messages.map((message,index)=>{
            return(<div key={index} className='msg'>{message.color}: {message.payload}</div>)
          })}
          </div>
          <div className='inputForm'>
            <input  placeholder='введи сообщение' value={value} className='input' onChange={e =>setValue(e.target.value)}></input>
            <button className='btn' onClick={sendMessages}>Отправить</button>
          </div>
          
    </div>
    
    {/* </div> */}
    </div>   
    }      
    </div>}
  </div>
  
)
    }
