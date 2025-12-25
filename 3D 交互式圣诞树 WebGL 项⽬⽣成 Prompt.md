# 3D **交互式圣诞树** WebGL 项目生成 Prompt

请扮演⼀位精通 React、Three.js (R3F) 和 WebGL 交互设计的专家级前端⼯程师。请使⽤以下技术栈和需求，构建⼀个名为 "Merry Christmas WebGL" 的 3D 互动⽹⻚应⽤。

1. **技术栈**

核⼼框架: React 183D 引擎: Three.js, @react-three/fiber, @react-three/drei

动画库: GSAP (⽤于复杂的过渡动画)

状态管理: Zustand (管理场景阶段、⼿势状态、相机⽬标)

样式: Tailwind CSS (⽤于 UI 界⾯)

视觉算法: @mediapipe/tasks-vision (⽤于⼿势识别)

后期处理: @react-three/postprocessing (Bloom, Vignette)

构建⼯具: Webpack (配置 babel-loader, css-loader, postcss-loader)

2. **核心场景** (Scene)

环境: 深邃的⿊⾊背景，点缀动态的星星 (Stars) 和闪烁粒⼦ (Sparkles)。

光照: 暖⾊主光 (Warm PointLight) 照亮树体。

冷⾊补光 (Cool PointLight) 增加边缘层次。顶部聚光灯 (SpotLight) 营造神圣感。使⽤ HDR 环境贴图(如 Shanghai Bund) 增强⾦属材质的反射质感。

后期: 启⽤ Bloom (辉光) 效果，让星星和装饰物发光；启⽤ Vignette (晕影) 聚焦视线。

3. **核心功能与交互阶段**

项⽬包含四个主要阶段 (Phase)，通过 Zustand 管理流转：

A. **树形态** (Phase: 'tree')

粒⼦系统: 使⽤ instancedMesh ⽣成约 5000+ 个绿⾊粒⼦组成圆锥体圣诞树。

装饰物: 螺旋分布的装饰球，包含 5 种 PBR 材质颜⾊（复古⾦、酒红、灰蓝、玫瑰粉、⾹槟⾊）。顶部有⼀颗发光的星星。悬浮的⽩⾊发光雪花。

交互效果: ⽔波纹斥⼒: 当⿏标悬停或⼿指触摸树体时，粒⼦和装饰物会像⽔波⼀样产⽣斥⼒散开，移开后复原。

⼿势触发: 识别到 "五指张开 (Open Palm)" ⼿势时，触发炸开动画，进⼊ 'blooming' 阶段。

B. **炸开过渡** (Phase: 'blooming')

使⽤ GSAP 动画，让所有粒⼦、装饰物和隐藏的照⽚从树中⼼向外爆炸扩散。动画结束后⾃动进⼊'nebula' 阶段。

C. **星云**/**照片墙形态** (Phase: 'nebula')

布局: 所有元素扩散形成⼀个巨⼤的环形星云。

照⽚墙: 24 张拍⽴得⻛格的照⽚悬浮在环形轨道上。	

智能横竖版适配: ⾃动检测照⽚纹理的宽⾼⽐。如果是横版照⽚，⾃动旋转拍⽴得相框 90 度，确保显示⾃然。

轮播交互: ⽀持⼿势 "五指张开 (Open Palm)" 左右滑动来控制照⽚环的旋转（翻⻚）。 点击某张照⽚，相机平滑推进聚焦到该照⽚。

重置交互: 识别到 "握拳 (Closed Fist)" ⼿势时，触发收缩动画，进⼊ 'collapsing' 阶段。

D. **收缩复原** (Phase: 'collapsing')

所有粒⼦和照⽚通过 GSAP 动画平滑收缩回圆锥体形态。动画结束后重置为 'tree' 阶段。

4. **手势控制** (HandTracker)

集成 MediaPipe HandLandmarker。

在右上⻆提供⼀个玻璃拟态⻛格的⾯板，显示摄像头预览。

提供 "OPEN/CLOSE CAMERA" 按钮控制摄像头开关。

⼿势定义:Open Palm: 触发炸开 / 左右翻⻚。

Closed Fist: 触发重置复原。

5. UI **界面设计**

⻛格: 极简主义，玻璃拟态 (Glassmorphism)，节⽇氛围。

标题: 屏幕中央显示巨⼤的 "Merry Christmas" (Cursive 字体，⾦⾊发光)。

状态提示: 左上⻆显示当前⼿势状态和操作指引。

⾳乐播放器: 底部居中播放 "Merry Christmas Mr. Lawrence"。包含旋转的冰晶雪花图标和滚动的歌名⽂字。带有呼吸灯光效。

6. **资源素材**

照⽚链接:(这⾥是链接...)

BGM: (这⾥是链接...)

7. **代码结构要求**

src/components/ChristmasTree.jsx: 核⼼ 3D 逻辑，包含粒⼦⽣成、材质管理、GSAP 动画和交互斥⼒逻辑。

src/components/Scene.jsx: 场景容器，灯光，相机控制，后期处理。

src/components/HandTracker.jsx: 摄像头与 MediaPipe 逻辑。

src/components/UI.jsx: 2D 界⾯层。

src/store.js: Zustand 状态定义。

src/utils/geometry.js: 数学计算辅助函数（⽣成圆锥、球体点云）。

请基于以上需求，⽣成完整的项⽬代码。