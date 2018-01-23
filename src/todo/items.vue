<template>
  <div :class="['todo-item', todo.completed ? 'completed' : '']">
    <input 
      type="checkbox" 
      v-model="todo.completed" 
      class="toggle"
    >
    <label for="">{{todo.content}}</label>
    <button class="delete" @click="deleteTodo"></button>
  </div>
</template>
<script>
export default {
  props: {
    todo: {
      type: Object,
      required: true
    }
  },
  methods: {
    deleteTodo(){
      this.$emit('del', this.todo.id)
    }
  }
}
</script>

<style lang="stylus" scoped>
.todo-item  
  position relative
  background #ffffff
  font-size 24px
  border-bottom 1px solid rgba(0,0,0,.06)
  &:hover
    .delete:after 
      content: 'x'
  label  
    white-space pre-line
    word-break break-all
    padding 15px 60px 15px 15px
    margin-left 45px
    display block 
    line-height 1.2
    transition color 0.4s
&.completed
  label 
    color #d9d9d9
    text-decoration line-through
.toggle
  text-align center 
  width 400px
  height 40px
  position absolute
  top 0
  bottom 0
  margin auto 0
  border none 
  outline none 
  appearance none
.delete
  position absolute
  top 50%
  right 10px
</style>
