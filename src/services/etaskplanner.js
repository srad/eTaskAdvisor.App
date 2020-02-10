import axios from "axios";

const API_URL = process.env.VUE_APP_API_URL || "http://localhost:3000";
const JWTName = "token";

const store = window.localStorage;

class Api {
  /**
   * @returns {Promise<{token: String, user: String}>}
   */
  authenticate() {
    return new Promise(((resolve, reject) => {
      const token = this.getToken();
      const username = this.getUser();
      const axiosOptions = {
        headers: {},
        baseURL: API_URL,
        timeout: 10000,
      };

      if (!token) {
        this.createUser()
          .then(response => {
            store.setItem(JWTName, response.data.token);
            store.setItem("username", response.data.name);
            axiosOptions.headers.authorization = `Bearer ${this.getToken()}`;
            this.axios = axios.create(axiosOptions);
            resolve({token: this.getToken(), user: this.getUser()});
          })
          .catch(reject);
      } else {
        axiosOptions.headers.authorization = `Bearer ${this.getToken()}`;
        this.axios = axios.create(axiosOptions);
        resolve({token, username});
      }
    }));
  }

  /**
   * @param str
   * @returns {Promise<AxiosResponse<T>>}
   * @private
   */
  _query(str) {
    return new Promise((resolve, reject) => {
      this.axios.post(`${API_URL}/graphql`, {
        query: `{ ${str} }`,
      }).then(res => resolve(res.data.data))
        .catch(res => {
          console.error(res);
          reject(res);
        });
    });
  }

  /**
   * @param query
   * @returns {Promise<AxiosResponse<T>>}
   * @private
   */
  _mutate(query) {
    return new Promise((resolve, reject) => {
      this.axios({
        url: `${API_URL}/graphql`,
        method: "POST",
        data: {
          query: `mutation { ${query} }`,
        },
      }).then(res => resolve(res.data.data))
        .catch(res => {
          console.error(res);
          reject(res);
        });
    });
  }

  /**
   * @returns {Promise<AxiosResponse<{username: String, token: String}>>}
   * @static
   */
  createUser() {
    return axios.post(`${API_URL}/auth`);
  }

  /**
   * @returns {Promise<AxiosResponse<T>>}
   */
  getTasks() {
    return this._query("tasks { _id name description }");
  }

  /**
   * @returns {Promise<AxiosResponse<T>>}
   */
  getPlans() {
    return this._query("plans { _id task { name } subject from duration }");
  }

  /**
   * @returns {Promise<AxiosResponse<T>>}
   */
  getPlaces() {
    return this._query("places { _id name }");
  }

  /**
   * @returns {Promise<AxiosResponse<T>>}
   */
  getFactors() {
    return this._query("factors { _id name description }");
  }

  /**
   * @returns {Promise<AxiosResponse<T>>}
   */
  getImpacts() {
    return this._query("impacts { _id, task { name }, factor { name }, influence, source }");
  }

  /**
   * @param {{name: String, description: String}} task
   * @returns {Promise<AxiosResponse<{id: String, name: String, description: String}>>}
   */
  addTask(task) {
    return this._mutate(`addTask(name:"${task.name}", description:"${task.description}") {
        _id, name, description
      }`);
  }

  /**
   * @param {String} id
   * @returns {Promise<AxiosResponse<T>>}
   */
  deleteTask(id) {
    return this._mutate(`deleteTask(id:"${id}")`);
  }

  /**
   * @param {{name: String, description: String}} task
   * @returns {Promise<AxiosResponse<{id: String, name: String, description: String}>>}
   */
  addFactor(factor) {
    return this._mutate(`addFactor(name:"${factor.name}", description:"${factor.description}") {
        _id, name, description
      }`);
  }

  /**
   * @param {String} id
   * @returns {Promise<AxiosResponse<T>>}
   */
  deleteFactor(id) {
    return this._mutate(`deleteFactor(id:"${id}")`);
  }

  /**
   * @param {{name: String, description: String}} task
   * @returns {Promise<AxiosResponse<{id: String, name: String, description: String}>>}
   */
  addImpact(impact) {
    return this._mutate(`addImpact(factor: "${impact.factor}", task: "${impact.task}", influence: ${impact.influence}, source: "${impact.source}") {
        _id, task { name }, factor { name }, influence, source
      }`);
  }

  /**
   * @param {String} id
   * @returns {Promise<AxiosResponse<T>>}
   */
  deleteImpact(id) {
    return this._mutate(`deleteImpact(id:"${id}")`);
  }

  /**
   * @returns {string}
   */
  getUser() {
    return store.getItem("username");
  }

  /**
   * @returns {string}
   */
  getToken() {
    return store.getItem(JWTName);
  }
}

export {Api};