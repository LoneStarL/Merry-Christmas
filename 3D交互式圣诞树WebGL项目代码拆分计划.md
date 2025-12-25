# 3D交互式圣诞树WebGL项目代码拆分计划

## 1. 目标

将当前单一的`src/index.jsx`文件拆分为多个功能模块，提高代码的可维护性和可读性。

## 2. 拆分方案

### 2.1 创建目录结构

- `src/components/` - 存放React组件
- `src/utils/` - 存放工具函数

### 2.2 创建文件并迁移代码

#### 2.2.1 `src/store.js`

- 迁移Zustand状态管理逻辑
- 使用真正的Zustand库替换当前的自定义实现
- 包含所有状态变量和更新方法

#### 2.2.2 `src/utils/geometry.js`

- 迁移数学计算辅助函数
- 提取几何相关逻辑

#### 2.2.3 `src/components/Scene.jsx`

- 迁移Three.js场景设置
- 包含scene、camera、renderer初始化
- 灯光设置和背景星星创建
- 雪花效果和后期处理

#### 2.2.4 `src/components/ChristmasTree.jsx`

- 迁移粒子系统和装饰物逻辑
- 圣诞树粒子创建和动画
- 装饰物和顶部星星创建
- 照片创建和管理
- 阶段过渡动画

#### 2.2.5 `src/components/HandTracker.jsx`

- 迁移摄像头和MediaPipe手势识别
- 手部追踪初始化和摄像头控制
- 手势检测和识别
- 手势事件处理

#### 2.2.6 `src/components/UI.jsx`

- 迁移2D界面元素和事件处理
- UI更新逻辑
- 事件监听器
- 初始UI动画

### 2.3 更新主入口文件

- 更新`src/index.jsx`，整合所有组件
- 确保正确的依赖关系

## 3. 实现步骤

1. 创建必要的目录结构
2. 创建`src/store.js`，实现Zustand状态管理
3. 创建`src/utils/geometry.js`，提取几何相关函数
4. 创建`src/components/Scene.jsx`，实现场景设置
5. 创建`src/components/ChristmasTree.jsx`，实现圣诞树逻辑
6. 创建`src/components/HandTracker.jsx`，实现手势识别
7. 创建`src/components/UI.jsx`，实现UI交互
8. 更新`src/index.jsx`，整合所有组件
9. 测试确保项目能正常运行

## 4. 依赖关系

- 确保所有组件正确导入和使用store
- 确保组件间通信正常
- 确保Three.js和其他库正确引入

## 5. 注意事项

- 保持代码风格一致
- 确保性能不受影响
- 确保所有功能正常工作
- 测试不同浏览器兼容性
- 确保手势识别功能正常