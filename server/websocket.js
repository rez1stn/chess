const WebSocket =  require('ws')
 
const server = new WebSocket.Server({port:5000})

server.on('connection', ws => {
  ws.on('message', message => {
    msg = JSON.parse(message)
    ws.id = msg.id
    switch(msg.method){
      case 'connection':
        connectionHandler(ws,msg)
        break;
      case 'turn':
        turnHandler(msg)
        break;
      case 'messages':
        messagesHandler(msg)
        break;
    }
  })
  ws.on('close',message =>{
    
    
  })
 console.log(server.clients.size)
})

function connectionHandler(ws,msg){
  
  let members = countMembers(msg)
  if(members == 1){
    ws.send(JSON.stringify({
      method: 'setColor',
      color: 'white'
    }
    ))
  }else if(members == 2){
    ws.send(JSON.stringify({
      method: 'setColor',
      color: 'black'
    }))
  }else{
    ws.send(JSON.stringify({
      method:'limit'
    }))
  }
}

function countMembers(msg){
  let count = 0
  server.clients.forEach(client => {
    if(client.id == msg.id){
      count++
    }
  })
  return count
}

function turnHandler(msg){
  server.clients.forEach(client => {
    if(client.id == msg.id){
      client.send(JSON.stringify({
        method: 'turn',
        payload: msg.payload,
        turn:msg.turn
      }))
    }
  })
console.log('сейчас ход', msg.turn)
}
function messagesHandler(msg){
  server.clients.forEach(client => {
    if(client.id == msg.id){
      client.send(JSON.stringify({
        method: 'messages',
        payload: msg.payload,
        color:msg.color

      }))
    }
  })
}