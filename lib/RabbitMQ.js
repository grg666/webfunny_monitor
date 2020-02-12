let amqp = require('amqplib');


module.exports = class RabbitMQ {
  constructor() {
    this.hosts = ["amqp://localhost"];
    this.index = 0;
    this.length = this.hosts.length;
    this.open = amqp.connect(this.hosts[this.index]);
  }

  sendQueueMsg(queueName, msg, errCallBack) {
    let self = this;
    self.open
      .then(function (conn) {
        return conn.createChannel();
      })
      .then(function (channel) {
        return channel.assertQueue(queueName).then(function (ok) {
          return channel.sendToQueue(queueName, new Buffer.from(msg), {
            persistent: true
          });
        })
          .then(function (data) {
            if (data) {
              errCallBack && errCallBack("success");
              channel.close();
            }
          })
          .catch(function () {
            setTimeout(() => {
              if (channel) {
                channel.close();
              }
            }, 500)
          });
      })
      .catch(function () {
        // let num = self.index++;
        //
        // if (num <= self.length - 1) {
        //   self.open = amqp.connect(self.hosts[num]);
        // } else {
        //   self.index == 0;
        // }
      });
  }

  receiveQueueMsg(queueName, receiveCallBack, errCallBack) {
    let self = this;

    self.open
      .then(function (conn) {
        return conn.createChannel();
      })
      .then(function (channel) {
        return channel.assertQueue(queueName).then(function (ok) {
            channel.prefetch(10, false);
            return channel.consume(queueName, function (msg) {
              if (msg !== null) {
                let data = msg.content.toString();
                receiveCallBack && receiveCallBack(data, function() {});
                channel.ack(msg);
              }
            }).finally(function () { });
          })
      })
      .catch(function (e) {
        errCallBack(e)
        /**
         * 下面的逻辑是做容灾处理，会有多个rabbitmq服务用来切换
         * @type {number}
          let num = self.index++;
           if (num <= self.length - 1) {
            self.open = amqp.connect(self.hosts[num]);
          } else {
            self.index = 0;
            self.open = amqp.connect(self.hosts[0]);
          }
         */

      });
  }
}
// var mq = new RabbitMQ()
// setInterval(function () {
//   mq.sendQueueMsg("queue1", "这是一个队列消息", function (err) {
//     console.log(err)
//   })
// }, 5000)
//
// setInterval(function () {
//   mq.receiveQueueMsg("queue1", function (msg) {
//     console.log(msg)
//   }, function (error) {
//     console.log(error)
//   })
// }, 5000)
