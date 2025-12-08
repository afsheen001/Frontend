new Vue({
  el: '#app',

  data: {
    showCart: false,
    showCheckoutForm: false,
    showInfoModal: false,

    searchTerm: '',
    sortBy: '',
    sortOrder: 'asc',

    lessons: [],
    cart: [],
    customer: { name: '', email: '', phone: '' },
    selectedClass: {}
  },

  mounted() {
    this.fetchLessons();
  },

  computed: {
    totalPrice() {
      return 'AED ' + this.cart.reduce(
        (sum, item) => sum + parseInt(item.price.replace('AED ', '')),
        0
      );
    },

    filteredClasses() {
      const term = this.searchTerm.toLowerCase();

      let result = this.lessons.filter(cls =>
        cls.subject.toLowerCase().includes(term) ||
        cls.location.toLowerCase().includes(term) ||
        (cls.features || '').toLowerCase().includes(term) ||
        cls.price.toLowerCase().includes(term)
      );

      if (this.sortBy) {
        result.sort((a, b) => {
          let A = a[this.sortBy];
          let B = b[this.sortBy];

          if (this.sortBy === 'price') {
            A = parseInt(A.replace('AED ', ''));
            B = parseInt(B.replace('AED ', ''));
          } else if (this.sortBy === 'seats') {
            A = Number(A);
            B = Number(B);
          } else {
            A = A.toLowerCase();
            B = B.toLowerCase();
            return this.sortOrder === 'asc'
              ? A.localeCompare(B)
              : B.localeCompare(A);
          }

          return this.sortOrder === 'asc' ? A - B : B - A;
        });
      }

      return result;
    }
  },

  methods: {
    async fetchLessons() {
      const res = await fetch('http://localhost:3000/lessons');
      this.lessons = await res.json();
    },

    toggleSort() {
      if (!this.sortBy) return alert('Select sort option');
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    },

    highlightText(text) {
      if (!this.searchTerm) return text;
      return text.replace(
        new RegExp(`(${this.searchTerm})`, 'gi'),
        '<mark>$1</mark>'
      );
    },

    addToCart(cls) {
      if (cls.seats <= 0) return;

      this.cart.push({
        _id: cls._id,
        subject: cls.subject,
        price: cls.price,
        image: cls.image
      });

      cls.seats -= 1;
      this.showCart = true;
    },

    removeFromCart(index) {
      const item = this.cart[index];
      const lesson = this.lessons.find(l => l._id === item._id);
      if (lesson) lesson.seats += 1;

      this.cart.splice(index, 1);
      if (!this.cart.length) this.showCart = false;
    },

    toggleCart() {
      this.showCart = !this.showCart;
    },

    openCheckoutForm() {
      if (!this.cart.length) return alert('Cart empty');
      this.showCheckoutForm = true;
    },

    closeCheckoutForm() {
      this.showCheckoutForm = false;
    },

    validatePhoneInput() {
      this.customer.phone = this.customer.phone.replace(/\D/g, '');
    },

    validateEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    async confirmCheckout() {
      if (!this.customer.name || !this.customer.phone) return alert('Missing details');
      if (!this.validateEmail(this.customer.email)) return alert('Invalid email');

      await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: this.customer, items: this.cart })
      });

      alert(`Booking confirmed!\nTotal: ${this.totalPrice}`);

      this.cart = [];
      this.customer = { name: '', email: '', phone: '' };
      this.showCheckoutForm = false;
      this.showCart = false;
      this.fetchLessons();
    },

    openClassInfo(cls) {
      this.selectedClass = cls;
      this.showInfoModal = true;
    },

    closeClassInfo() {
      this.showInfoModal = false;
    }
  }
});
