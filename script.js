function updateSubtask() {
  const type = document.getElementById("type").value;
  const subtaskSelect = document.getElementById("task");

  // 清空原来的选项
  subtaskSelect.innerHTML = "";

  let options = [];

  if (type === "Diagnosis") {
    options = ["Risk Group", "Subtype", "Shimada", "MKI"];
  } else if (type === "BiomarkerPrediction") {
    options = ["ALK", "NMYC", "CMYC", "1p36", "11q23"];
  } else if (type === "Prognosis") {
    options = ["PFS", "OS"];
  }

  if (options.length > 0) {
    options.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      subtaskSelect.appendChild(opt);
    });
    
    // 自动选择第一个选项并更新预测信息
    subtaskSelect.value = options[0];
    updatePredictionInfo(); // 立即更新预测信息
  } else {
    const opt = document.createElement("option");
    opt.value = "";
    opt.textContent = "-- Please select a task first --";
    subtaskSelect.appendChild(opt);
  }
}


// 当 Task 下拉框变化时调用
function updatePredictionInfo() {
  const selectedTask = document.getElementById("task").value;
  
  // 检查元素是否存在
  const predictionTaskEl = document.getElementById("prediction-task");
  const predictionTypeEl = document.getElementById("prediction-type");
  const groundTruthEl = document.getElementById("ground-truth");
  const predictionResultEl = document.getElementById("prediction-result");
  const confidenceEl = document.getElementById("confidence");

  // 更新 Prediction Results 中的 Task
  if (predictionTaskEl) {
    predictionTaskEl.textContent = selectedTask;
  }

  // 判断任务类型
  const classificationTasks = [
    "Risk Group", "Subtype", "Shimada", "MKI",
    "ALK", "NMYC", "CMYC", "1p36", "11q23"
  ];
  const regressionTasks = ["PFS", "OS"];

  let predictionType = "--";
  if (classificationTasks.includes(selectedTask)) {
    predictionType = "Classification";
    
    if (selectedTask === "Subtype") {
      if (groundTruthEl) groundTruthEl.textContent = "Neuroblastoma";
      if (predictionResultEl) predictionResultEl.textContent = "Neuroblastoma";
      if (confidenceEl) confidenceEl.textContent = "0.983";
    }
    // 为其他分类任务添加默认值
    else {
      if (groundTruthEl) groundTruthEl.textContent = "Unknown";
      if (predictionResultEl) predictionResultEl.textContent = "Unknown";
      if (confidenceEl) confidenceEl.textContent = "1.000";
    }
  }
  else if (regressionTasks.includes(selectedTask)) {
    predictionType = "Regression";

    if (selectedTask === "PFS") {
      if (predictionResultEl) {
        predictionResultEl.textContent = "Higih Risk";
      }
      if (groundTruthEl) {
        groundTruthEl.textContent = "High Risk";
      }
      if (confidenceEl) {
        confidenceEl.textContent = "---";
      }
    }
    else if (selectedTask === "OS") {
      if (predictionResultEl) {
        predictionResultEl.textContent = "High Risk";
      }
      if (groundTruthEl) {
        groundTruthEl.textContent = "High Risk";
      }
      if (confidenceEl) {
        confidenceEl.textContent = "---";
      }
    }
    else {
      if (predictionTaskEl) predictionTaskEl.textContent = "---";
      if (predictionTypeEl) predictionTypeEl.predictionTypeEl = "---";
      if (predictionResultEl) predictionResultEl.textContent = "---";
      if (groundTruthEl) groundTruthEl.textContent = "---";
      if (confidenceEl) confidenceEl.textContent = "---";
    }
  }

  // 更新 Prediction Results 中的 Type
  if (predictionTypeEl) {
    predictionTypeEl.textContent = predictionType;
  }
}


// 图像同步功能
class ImageSynchronizer {
  constructor() {
    this.syncState = {
      scale: 1,
      translateX: 0,
      translateY: 0,
      isDragging: false,
      lastMouseX: 0,
      lastMouseY: 0
    };
    
    this.initializeElements();
    this.setupEventListeners();
  }
  
  initializeElements() {
    this.originContainer = document.getElementById('originContainer');
    this.heatmapContainer = document.getElementById('heatmapContainer');
    this.originWrapper = document.getElementById('originWrapper');
    this.heatmapWrapper = document.getElementById('heatmapWrapper');
    this.zoomInBtn = document.getElementById('zoomInBtn');
    this.zoomOutBtn = document.getElementById('zoomOutBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.zoomLevel = document.getElementById('zoomLevel');
  }
  
  setupEventListeners() {
    // 为两个图像容器添加事件监听器
    [this.originContainer, this.heatmapContainer].forEach(container => {
      if (container) {
        // 鼠标事件
        container.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        container.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // 触摸事件
        container.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        container.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        container.addEventListener('touchend', (e) => this.handleTouchEnd(e));
      }
    });
    
    // 控制按钮事件 决定滚动滑轮的每次行为的放缩尺度
    if (this.zoomInBtn) this.zoomInBtn.addEventListener('click', () => this.zoomImage(1.5));
    if (this.zoomOutBtn) this.zoomOutBtn.addEventListener('click', () => this.zoomImage(0.67));
    if (this.resetBtn) this.resetBtn.addEventListener('click', () => this.resetPosition());
  }
  
  updateTransform() {
    const transform = `scale(${this.syncState.scale}) translate(${this.syncState.translateX}px, ${this.syncState.translateY}px)`;
    if (this.originWrapper) this.originWrapper.style.transform = transform;
    if (this.heatmapWrapper) this.heatmapWrapper.style.transform = transform;
    if (this.zoomLevel) this.zoomLevel.textContent = `${Math.round(this.syncState.scale * 100)}%`;
  }
  
  resetPosition() {
    this.syncState.scale = 1;
    this.syncState.translateX = 0;
    this.syncState.translateY = 0;
    this.updateTransform();
  }
  
  //确定扩大或缩小的范围，最小缩小到原来的0.5倍，最大扩大到原来的20倍
  zoomImage(factor, centerX = 0.5, centerY = 0.5) {
    const newScale = Math.max(0.5, Math.min(10, this.syncState.scale * factor));
    
    if (newScale === this.syncState.scale) return; // 如果达到边界，不进行缩放
    
    // 获取容器尺寸
    const rect = this.originContainer ? this.originContainer.getBoundingClientRect() : { width: 400, height: 400 };
    
    // 计算缩放中心点在容器中的像素坐标
    const centerXPx = rect.width * centerX;
    const centerYPx = rect.height * centerY;
    
    // 计算缩放中心点在当前变换后图像中的坐标
    const imageX = (centerXPx - rect.width / 2) / this.syncState.scale - this.syncState.translateX;
    const imageY = (centerYPx - rect.height / 2) / this.syncState.scale - this.syncState.translateY;
    
    // 更新缩放比例
    this.syncState.scale = newScale;
    
    // 计算新的平移量，使缩放中心保持在鼠标位置
    this.syncState.translateX = (centerXPx - rect.width / 2) / this.syncState.scale - imageX;
    this.syncState.translateY = (centerYPx - rect.height / 2) / this.syncState.scale - imageY;
    
    this.updateTransform();
  }
  
  handleMouseDown(e) {
    e.preventDefault();
    this.syncState.isDragging = true;
    this.syncState.lastMouseX = e.clientX;
    this.syncState.lastMouseY = e.clientY;
    
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
  }
  
  handleMouseMove(e) {
    if (!this.syncState.isDragging) return;
    
    e.preventDefault();
    const deltaX = e.clientX - this.syncState.lastMouseX;
    const deltaY = e.clientY - this.syncState.lastMouseY;
    
    this.syncState.translateX += deltaX / this.syncState.scale;
    this.syncState.translateY += deltaY / this.syncState.scale;
    
    this.syncState.lastMouseX = e.clientX;
    this.syncState.lastMouseY = e.clientY;
    
    this.updateTransform();
  }
  
  handleMouseUp(e) {
    this.syncState.isDragging = false;
    document.removeEventListener('mousemove', this.handleMouseMove.bind(this));
    document.removeEventListener('mouseup', this.handleMouseUp.bind(this));
  }
  
  handleWheel(e) {
    e.preventDefault();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = (e.clientX - rect.left) / rect.width;
    const centerY = (e.clientY - rect.top) / rect.height;
    
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    this.zoomImage(factor, centerX, centerY);
  }
  
  handleTouchStart(e) {
    e.preventDefault();
    
    if (e.touches.length === 1) {
      this.syncState.isDragging = true;
      this.syncState.lastMouseX = e.touches[0].clientX;
      this.syncState.lastMouseY = e.touches[0].clientY;
    }
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    
    if (e.touches.length === 1 && this.syncState.isDragging) {
      const deltaX = e.touches[0].clientX - this.syncState.lastMouseX;
      const deltaY = e.touches[0].clientY - this.syncState.lastMouseY;
      
      this.syncState.translateX += deltaX / this.syncState.scale;
      this.syncState.translateY += deltaY / this.syncState.scale;
      
      this.syncState.lastMouseX = e.touches[0].clientX;
      this.syncState.lastMouseY = e.touches[0].clientY;
      
      this.updateTransform();
    }
  }
  
  handleTouchEnd(e) {
    this.syncState.isDragging = false;
  }
}

// 页面加载完成后初始化图像同步功能
document.addEventListener('DOMContentLoaded', function() {
  // 等待一小段时间确保所有元素都已渲染
  setTimeout(() => {
    window.imageSynchronizer = new ImageSynchronizer();
  }, 100);
});
