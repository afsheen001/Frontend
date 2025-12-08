new Vue({
  el: '#app',

  data: {
    // UI state
    showCart: false,
    showCheckoutForm: false,
    showInfoModal: false,

    // search & sort
    searchTerm: '',
    sortBy: '',
    sortOrder: 'asc',

    // data
    lessons: [],
    cart: [],
    customer: {
      name: '',
      email: '',
      phone: ''
    },
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

      // sorting
      if (this.sortBy) {
        result.sort((a, b) => {
          let A = a[this.sortBy];
          let B = b[this.sortBy];

          // numeric sort for price / seats
          if (this.sortBy === 'price') {
            A = parseInt(A.replace('AED ', ''));
            B = parseInt(B.replace('AED ', ''));
          } else if (this.sortBy === 'seats') {
            A = Number(A);
            B = Number(B);
          } else {
            // string sort for subject / location
            A = A.toString().toLowerCase();
            B = B.toString().toLowerCase();
            const comp = A.localeCompare(B);
            return this.sortOrder === 'asc' ? comp : -comp;
          }

          if (A < B) return this.sortOrder === 'asc' ? -1 : 1;
          if (A > B) return this.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }

      return result;
    }
  },

  methods: {
    async fetchLessons() {
      try {
        const res = await fetch('http://localhost:3000/lessons');
        this.lessons = await res.json();
      } catch (err) {
        console.error('Error fetching lessons', err);
      }
    },

    toggleSort() {
      if (!this.sortBy) {
        alert('Please select a sort option first');
        return;
      }
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    },

    highlightText(text) {
      if (!this.searchTerm) return text;
      const regex = new RegExp(`(${this.searchTerm})`, 'gi');
      return text.replace(regex, '<mark>$1</mark>');
    },

    addToCart(cls) {
      if (cls.seats <= 0) return;

      this.cart.push(cls);
      cls.seats -= 1;
      this.showCart = true; // open cart as soon as item added
    },

    removeFromCart(index) {
      this.cart[index].seats += 1;
      this.cart.splice(index, 1);

      if (!this.cart.length) {
        this.showCart = false;
      }
    },

    toggleCart() {
      this.showCart = !this.showCart;
    },

    openCheckoutForm() {
      if (!this.cart.length) {
        alert('Cart is empty');
        return;
      }
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
      if (!this.customer.name.trim() || !this.customer.phone.trim()) {
        alert('Please enter your name and phone number.');
        return;
      }
      if (!this.validateEmail(this.customer.email)) {
        alert('Please enter a valid email.');
        return;
      }
      if (!this.cart.length) {
        alert('Your cart is empty.');
        return;
      }

      try {
        await fetch('http://localhost:3000/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer: this.customer,
            items: this.cart
          })
        });

        alert(
          `🎨 Thank you ${this.customer.name}!\n` +
          `Your booking for ${this.cart.length} class(es) is confirmed.\n` +
          `Total: ${this.totalPrice}`
        );

        // reset
        this.cart = [];
        this.customer = { name: '', email: '', phone: '' };
        this.showCheckoutForm = false;
        this.showCart = false;

        // refresh lessons (seats)
        this.fetchLessons();
      } catch (err) {
        console.error('Error placing order', err);
        alert('Failed to place order. Please try again.');
      }
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
