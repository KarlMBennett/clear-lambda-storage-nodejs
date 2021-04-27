function Queue(capacity){
    'use strict';

    if((typeof capacity === 'undefined') || capacity <= 0){
        capacity = 100;
    }

    this.capacity = capacity;
    this.container = [];
    this.nextWriteIndex = 0;
    this.nextReadIndex = 0;
    this.lastWriteIndex = null;
    this.lastReadIndex = null;
}

Queue.prototype.getCapacity = function(){
    'use strict';
    return this.capacity;
};

Queue.prototype.getCount = function(){
    'use strict';

    if(this.noOneEverWrite()) {
        return 0;
    }

    if(this.noOneEverRead()) {
        return this.lastWriteIndex+1;
    }

    if(this.writtenMoreOrAsMuchAsRead()){
        return this.lastWriteIndex - this.lastReadIndex;
    }
    return this.capacity + this.lastWriteIndex - this.lastReadIndex;
};

Queue.prototype.isFull = function(){
    'use strict';

    return this.getCount() == this.capacity;

};

Queue.prototype.noOneEverWrite = function(){
    'use strict';

    return this.lastWriteIndex === null;
};

Queue.prototype.noOneEverRead = function(){
    'use strict';

    return this.lastReadIndex === null;
};

Queue.prototype.writtenMoreOrAsMuchAsRead = function(){
    'use strict';

    return this.lastWriteIndex >= this.lastReadIndex;
};

Queue.prototype.enqueue = function(item){
    'use strict';

    if(this.getCount() === this.capacity)
        throw new Error("Queue is full!");

    this.container[this.nextWriteIndex] = item;

    this.updateWriteIndicies();
};

Queue.prototype.updateWriteIndicies = function(){
    'use strict';

    this.lastWriteIndex = this.nextWriteIndex;

    if (this.nextWriteIndex + 1 === this.capacity)
        this.nextWriteIndex = 0;
    else
        this.nextWriteIndex++;
};

Queue.prototype.dequeue = function(){
    'use strict';

    if(this.getCount() === 0)
        throw new Error("Queue is empty!");

    var item = this.container[this.nextReadIndex];

    this.updateReadIndicies();

    return item;
};

Queue.prototype.peek = function(){
    'use strict';

    if(this.getCount() === 0)
        throw new Error("Queue is empty!");

    var item = this.container[this.nextReadIndex];

    return item;
};

Queue.prototype.last = function(){
    'use strict';

    if(this.getCount() === 0)
        throw new Error("Queue is empty!");

    var item = this.container[this.lastWriteIndex];

    return item;
};

Queue.prototype.updateReadIndicies = function(){
    'use strict';

    this.lastReadIndex = this.nextReadIndex;

    if (this.nextReadIndex + 1 === this.capacity)
        this.nextReadIndex = 0;
    else
        this.nextReadIndex++;
};

module.exports = Queue;