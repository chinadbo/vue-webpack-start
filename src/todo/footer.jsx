import '../assets/style/footer.styl'
export default {
  data() {
    return {
      author: 'Ioodu'
    }
  },
  render() {
    return (
      <footer id="footer">
        <span>Written by {this.author}</span>
      </footer>
    )
  }
}