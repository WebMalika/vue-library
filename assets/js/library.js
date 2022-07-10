// установка рандомной фоновой канртинки
document.body.style.backgroundImage = `url('assets/images/${Math.floor(Math.random() * 7) + 1}.jpg')`
 
if(!localStorage.getItem('storage-books')) listUpdate({})
let stotage = JSON.parse(localStorage.getItem('storage-books'))
function listUpdate(list){
    localStorage.setItem('storage-books', JSON.stringify(list))
}
function createColor(){
    return "rgb(" + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + "," + Math.floor(Math.random() * 255) + ")"
}

const app =  Vue.createApp({
    data() {
        return {
            title: "Моя полка",
            books: null,
            storage: JSON.parse(localStorage.getItem('storage-books')),
            response: null,
            searchValue: null,
            startIndex: 0
        }
    },
    template: `
        <div class='container'> 
            {{bookChange}}
            <div class="app-title">{{title}}</div>
            <search-form @get-axios='getAxios($event)'></search-form>
            <div v-show="response" class="books-shelf">                               
                <div v-if="books" class="grid-container">
                    <caption-group-block caption="Результаты поиска" :funcClear="clearBooks" btnCaption="Очистить"></caption-group-block> 
                    <book-list :storage="storage" :books="books" @addStorage="changeStorage($event)"></book-list>
                    <page-navigation :getNextAxios="getNextAxios" :all="response.data.totalItems" :startIndex="getNewStartIndex"></page-navigation>
                </div>
                <p class="not-data" v-else>Поиск завершился наудачно... Попробуйте спросить иначе</p>
            </div>
            <div v-if="Object.keys(this.storage).length != 0" class="books-shelf storage-shelf grid-container">
                <caption-group-block caption="Любимое" :funcClear="clearStorage" btnCaption="Очистить"></caption-group-block>
                <book-list :books="storage" :storage="storage" @addStorage="changeStorage($event)"></book-list>
            </div>
            <div class="dashboards grid-container" v-if="Object.keys(this.storage).length != 0">
                <h2 class="caption">Сводные данные</h2>
                <price-storage-dashboard :storage="storage"></price-storage-dashboard>
            </div>
            <p class="not-data" v-if="!books && Object.keys(this.storage).length == 0">Кажется, пока здесь ничего нет...   Попробуйте наш поиск</p>
        </div>
    `,
    mounted(){
        
    },
    computed: {
        bookChange: function(){
            // console.log( this.books);
        },
        getNewStartIndex: function(){
            // console.log(this.startIndex);
            return this.startIndex;
        }
    },
    methods: {
        getAxios: function(searchValue){
            if(searchValue){
                this.searchValue = searchValue.toLowerCase().split(" ").join("+");
                axios
                    .get('https://www.googleapis.com/books/v1/volumes?startIndex=0&maxResults=15&q=' + this.searchValue)
                    .then(response => {
                        this.response = response
                        this.books = response.data.items
                        // console.log(response);
                    })
                    .catch(error => console.log(error));
            }
            
        },
        getNextAxios: function(page){
            this.startIndex = page - 1;
            axios
                .get('https://www.googleapis.com/books/v1/volumes?startIndex=' + this.startIndex + '&maxResults=15&q=' + this.searchValue)
                .then(response => {
                    this.books = response.data.items
                })
                .catch(error => console.log(error));
        },
        changeStorage: function(book){
            if(!this.storage[book.id]){
                book.color = createColor();
                this.storage[book.id] = book
            }
            else 
                delete this.storage[book.id];
            listUpdate(this.storage);
        },
        clearBooks: function(){
            this.response = null;
            this.books = null;
        },
        clearStorage: function(){
            this.storage = {};
            listUpdate({})
        }
    }
})

app.component('search-form', {
    emits: ['getAxios'],
    data(){
        return{
            newValue: null
        }
    },
    template: `
    <div class="search card">
        <input @keyup.enter="$emit('getAxios', newValue)" type="text" v-model="newValue" class="search__input"/>
        <button @click="$emit('getAxios', newValue)" class="search__btn btn"><span class="icon-search"></span></button>
    </div>
    `,
    methods: {        
        
    }
});
app.component('book-list', {
    props: {
        books: Array,
        storage: Array
    },
    template: `
        <div class="books-shelf__container">
            <div class="books-shelf__item book" v-for="book in books">
                <book-image  :book="book.volumeInfo"></book-image>
                <book-info  :book="book.volumeInfo"></book-info>
                <book-interface 
                    :book="book.volumeInfo" 
                    @addStorage="$emit('addStorage', book)"
                    :isLike="storage[book.id] ? true : false"></book-interface>
            </div>
        </div>
    `,
})
app.component('book-image', {
    props: {
        book: Object
    },
    template: `
        <div   
            class="book__image"
            v-if="book.imageLinks"
            :style='{backgroundImage: "url(" + book.imageLinks.smallThumbnail + ")"}'
        ></div>
        <div class="book__image_no book__image" v-else><span class="icon-camera-off"></span></div>
    `
})
app.component('book-info', {
    props: {
        book: Object
    },
    template: `
    <div class="book__info-card">
        <span class="book__name">{{ book.title }}</span>  
        <div class="book__authors  d-flex"  v-if="book.authors">
            <span class="icon-feather icon"></span>
            <div class="book__authors-info">
                <span v-for="author in book.authors"> {{ author }} </span>                
            </div>
        </div>
        <div class="book__date d-flex" v-if="book.publishedDate">
            <span class="icon-calendar icon"></span> {{book.publishedDate}}
        </div>
    </div>
    `
})
app.component('book-interface', {
    props: {
        book: Object,
        isLike: Boolean
    },
    template: `
    <div class="book__interface">
        <span class="icon-heart btn btn-heart" @click="$emit('addStorage')" :class="classActive"></span>
        <a :href="book.infoLink" target="_blank" rel="noopener noreferrer" class="btn">
            <span class="icon-external-link"></span>        
        </a>
    </div>
    `,
    computed: {
        classActive: function(){
            return this.isLike ? "active" :  false
        }
    }
})
app.component('page-navigation', {
    props: {
        getNextAxios: Function,
        all: Number,
        startIndex: Number
    },
    data() {
        return {
            statrIndexes: [this.startIndex + 1, this.startIndex + 2, this.startIndex + 3],
            finishIndex: [Math.round(this.all / 15) - 2, Math.round(this.all / 15) - 1, Math.round(this.all / 15)]
        }
    },
    template: `
    <div class="page-navigation">

        <span 
            class="page-navigation__number page-navigation__element" 
            @click="getNextAxios(item)"
            v-for="item in getStartIndexes"
        >{{item}}</span>

        <span v-if="startIndex + 1 < finishIndex[0]" class="page-navigation__span page-navigation__element">...</span>
        
        <span 
            class="page-navigation__number page-navigation__element" 
            @click="getNextAxios(item)"
            v-for="item in finishIndex"
        >{{item}}</span>
    </div>
    `,
    computed: {
        getStartIndexes: function(){
            let result;
            if((this.startIndex + 1) < this.finishIndex[0])
                result = [this.startIndex + 1, this.startIndex + 2, this.startIndex + 3];
            else if((this.startIndex + 1) == this.finishIndex[1])
                result = [this.startIndex - 3, this.startIndex - 2, this.startIndex - 1];
            else if((this.startIndex + 1) == this.finishIndex[2])
                result = [this.startIndex - 4, this.startIndex - 3, this.startIndex - 2];
            else 
                result = [this.startIndex - 2, this.startIndex - 1, this.startIndex];


            return result;
        }
    }
})
app.component('price-storage-dashboard', {
    props: {
        storage: {
            type: Object,
            required: true
        }
    },
    data(){
        return {
            commonPriсe: 0,
            retailCommonPrice: 0
        }
    },
    template: `
    <div class="price-dashboard">
        <donut-chart :mass="storage" :all="commonPriсe"></donut-chart>
        <div class="price-dashboard__text-fields">        
            <prise-text-field 
                title="Общая цена Вашей библиотеки"
                :mass="storage"
                field="listPrice"
                parField="saleInfo"
                @getPrice="commonPriсe = $event"
            ></prise-text-field>

            <prise-text-field 
                title="Текущая цена с учетом скидок"
                :mass="storage"
                field="retailPrice"
                parField="saleInfo"
                @getPrice="retailCommonPrice = $event"
            ></prise-text-field>
        </div>
    </div>    
    `,
    computed: {}
})
app.component('prise-text-field', {
    props: {
        title: String,
        mass: Object,
        field: String,
        parField: String
    },
    data(){
        return {
            price: 0
        }
    },
    template: `
        <div class="price-dashboard__common-prise">
            <span class="price-dashboard__title">{{ title }}:</span>
            <span class="price-dashboard__value">{{ getPrice }}</span>
        </div>    
    `,
    computed: {
        getPrice: function(){
            this.price = 0
            for(let item in this.mass){
                if(this.mass[item][this.parField][this.field])
                    this.price += this.mass[item][this.parField][this.field].amount;
            }
            this.price = Math.round(this.price);
            this.$emit('getPrice', this.price)
            return this.price + " RUB";
        }
    }
})

app.component("donut-chart", {
    props: {
        all: {
            type: Number,
            required: true
        },
        mass: Object
    },
    data() {
        return {
            allDashOffset: 0
        }
        
    },
    template: `
    <div class="donut-chart">
        <div class="donut-chart__chart">
            <svg width="100%" height="100%" viewBox="0 0 42 42" class="donut">
                <circle class="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="transparent"></circle>
                <circle class="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#d2d3d4" stroke-width="2"></circle>
                <donut-pie-svg 
                    v-for="item in mass"
                    :all="all"
                    :percent="getPercent(item)"
                    :dashoffset="allDashOffset"
                    :color="item.color"
                ></donut-pie-svg>
                
                <g class="chart-text">
                    <text x="50%" y="50%" class="chart-number">
                    {{ all }}
                    </text>
                    <text x="50%" y="50%" class="chart-label">
                    RUB
                    </text>
                </g>
            </svg>
        </div>
        <div class="donut-chart__legend"> 
            <div v-for="item in mass">
                <div class="donut-chart__legend_item" v-if=(item.saleInfo.listPrice)>
                    <div class="color-legend" :style="{background: item.color}"></div>
                    <span>{{ item.volumeInfo.title}} <b>({{item.saleInfo.listPrice.amount}} RUB)</b></span>
                </div>
            </div>
        </div>
    </div>
    `,
    methods: {
        getPercent(item){
            if(this.allDashOffset > 1000) this.allDashOffset = this.allDashOffset / 1000;
            if(item.saleInfo.listPrice && this.all && item.saleInfo.listPrice.amount){
                this.allDashOffset += item.saleInfo.listPrice.amount / this.all * 100               
                return item.saleInfo.listPrice.amount / this.all * 100
            } else return 0
        }
    },
    computed: {
       
    }
})
app.component('donut-pie-svg', {
    props: {
        all: Number,
        percent: Number,
        dashoffset: Number,
        color: String
    },
    data() {
        return {

        }
    },
    template: `
        <circle
            class="donut-segment" 
            cx="21" cy="21" r="15.91549430918954" 
            fill="transparent" :stroke="color" stroke-width="2" 
            :stroke-dasharray="getPercentStr" 
            :stroke-dashoffset="getDashOffset"
        ></circle>
    `,
    computed: {
        getPercentStr: function(){
            return this.percent + ' '  + (100 - this.percent)
        },
        getDashOffset: function(){
            return 100 - this.dashoffset + this.percent
        }
    }
})
app.component('caption-group-block', {
    props: {
        caption: String,
        funcClear: Function,
        btnCaption: String
    },
    template: `
        <div class="caption-group">
            <h2 class="caption">{{caption}}</h2>
            <button class="clear-btn btn" @click="funcClear">{{btnCaption}}</button>
        </div>
    `
})

app.mount(".app")
