<template>
  <div id="app">
    <el-container>
      <el-header>
        <nav>
          <router-link to="/">Home</router-link>
          <router-link to="/historical-data">Historical Data</router-link>
          <router-link to="/predictions">Predictions</router-link>
          <router-link to="/profile">Profile</router-link>
        </nav>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
      <el-footer>
        <div class="disclaimer">
          <h3>Responsible Gambling Disclaimer</h3>
          <p>
            This application is for educational and entertainment purposes only. Lottery draws are random events,
            and no prediction method can guarantee winning outcomes. Please gamble responsibly and within your means.
          </p>
          <p>
            If you or someone you know has a gambling problem, please seek help from professional support services.
          </p>
        </div>
      </el-footer>
    </el-container>
  </div>
</template>

<script setup>
// Application root component
</script>

<style scoped>
#app {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  min-height: 100vh;
}

.el-header {
  background-color: #409eff;
  color: white;
  padding: 0 20px;
}

nav {
  display: flex;
  align-items: center;
  height: 100%;
  gap: 20px;
}

nav a {
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav a:hover,
nav a.router-link-active {
  background-color: rgba(255, 255, 255, 0.1);
}

.el-footer {
  background-color: #f5f7fa;
  padding: 20px;
}

.disclaimer {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.disclaimer h3 {
  color: #f56c6c;
  margin-bottom: 10px;
}

.disclaimer p {
  color: #666;
  line-height: 1.6;
  margin: 8px 0;
}
</style>