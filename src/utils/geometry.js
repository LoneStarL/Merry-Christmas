// 数学计算辅助函数和几何相关逻辑
import * as THREE from 'three';

// ============================================
// 数学计算辅助函数
// ============================================

/**
 * 计算两点之间的距离
 * @param {number} x1 - 第一个点的x坐标
 * @param {number} y1 - 第一个点的y坐标
 * @param {number} z1 - 第一个点的z坐标
 * @param {number} x2 - 第二个点的x坐标
 * @param {number} y2 - 第二个点的y坐标
 * @param {number} z2 - 第二个点的z坐标
 * @returns {number} 两点之间的距离
 */
export function calculateDistance(x1, y1, z1, x2, y2, z2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dz = z1 - z2;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 生成球面坐标点
 * @param {number} radius - 半径
 * @param {number} theta - 方位角（0到2π）
 * @param {number} phi - 极角（0到π）
 * @returns {Object} 包含x, y, z坐标的对象
 */
export function sphericalToCartesian(radius, theta, phi) {
    return {
        x: radius * Math.sin(phi) * Math.cos(theta),
        y: radius * Math.cos(phi),
        z: radius * Math.sin(phi) * Math.sin(theta)
    };
}

/**
 * 生成圆锥分布点
 * @param {number} height - 圆锥高度
 * @param {number} radius - 圆锥底部半径
 * @param {number} randomness - 随机因子（0到1）
 * @returns {Object} 包含x, y, z坐标的对象
 */
export function coneDistribution(height, radius, randomness = 0.5) {
    const y = Math.random() * height;
    const currentRadius = (1 - y / height) * radius * (0.5 + Math.random() * randomness);
    const angle = Math.random() * Math.PI * 2;
    
    return {
        x: Math.cos(angle) * currentRadius,
        y: y,
        z: Math.sin(angle) * currentRadius
    };
}

/**
 * 生成螺旋分布点
 * @param {number} index - 当前索引
 * @param {number} total - 总数
 * @param {number} height - 螺旋高度
 * @param {number} radius - 螺旋半径
 * @param {number} turns - 螺旋圈数
 * @returns {Object} 包含x, y, z坐标的对象
 */
export function spiralDistribution(index, total, height, radius, turns = 8) {
    const t = index / total;
    const y = t * height + 0.3;
    const currentRadius = (1 - y / (height + 0.3)) * radius;
    const angle = t * Math.PI * 2 * turns;
    
    return {
        x: Math.cos(angle) * currentRadius,
        y: y,
        z: Math.sin(angle) * currentRadius
    };
}

/**
 * 生成环形分布点
 * @param {number} radius - 环半径
 * @param {number} heightVar - 高度变化范围
 * @returns {Object} 包含x, y, z坐标的对象
 */
export function ringDistribution(radius, heightVar = 2) {
    const angle = Math.random() * Math.PI * 2;
    const height = (Math.random() - 0.5) * heightVar;
    
    return {
        x: Math.cos(angle) * radius,
        y: 2.5 + height,
        z: Math.sin(angle) * radius
    };
}

/**
 * 生成随机分布点
 * @param {number} range - 分布范围
 * @returns {Object} 包含x, y, z坐标的对象
 */
export function randomDistribution(range = 15) {
    return {
        x: (Math.random() - 0.5) * range,
        y: Math.random() * range,
        z: (Math.random() - 0.5) * range
    };
}

// ============================================
// 几何形状生成
// ============================================

/**
 * 创建星形形状
 * @param {number} outerRadius - 外半径
 * @param {number} innerRadius - 内半径
 * @param {number} spikes - 尖峰数量
 * @returns {THREE.Shape} 星形形状
 */
export function createStarShape(outerRadius = 0.4, innerRadius = 0.2, spikes = 5) {
    const starShape = new THREE.Shape();
    
    for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        if (i === 0) {
            starShape.moveTo(x, y);
        } else {
            starShape.lineTo(x, y);
        }
    }
    
    starShape.closePath();
    return starShape;
}

/**
 * 计算波纹效果的力
 * @param {THREE.Vector3} position - 粒子位置
 * @param {THREE.Vector3} mousePos - 鼠标位置
 * @param {number} maxDistance - 最大影响距离
 * @param {number} forceMultiplier - 力的倍数
 * @returns {THREE.Vector3} 力向量
 */
export function calculateRippleForce(position, mousePos, maxDistance = 2, forceMultiplier = 0.02) {
    const dx = position.x - mousePos.x;
    const dy = position.y - mousePos.y;
    const dz = position.z - mousePos.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (dist < maxDistance) {
        const force = (maxDistance - dist) * forceMultiplier;
        return new THREE.Vector3(dx * force, dy * force, dz * force);
    }
    
    return new THREE.Vector3(0, 0, 0);
}

/**
 * 生成照片环上的位置
 * @param {number} index - 当前索引
 * @param {number} total - 总数
 * @param {number} radius - 环半径
 * @returns {Object} 包含position和rotation的对象
 */
export function photoRingPosition(index, total, radius = 12) {
    const angle = (index / total) * Math.PI * 2;
    
    return {
        position: new THREE.Vector3(
            Math.cos(angle) * radius,
            2.5 + Math.sin(angle * 3) * 0.5,
            Math.sin(angle) * radius
        ),
        angle: angle
    };
}

/**
 * 生成爆炸位置（用于粒子和装饰）
 * @param {number} angle - 基础角度
 * @param {number} minRadius - 最小半径
 * @param {number} maxRadius - 最大半径
 * @returns {THREE.Vector3} 爆炸位置
 */
export function generateExplosionPosition(angle, minRadius = 10, maxRadius = 15) {
    const radius = minRadius + Math.random() * (maxRadius - minRadius);
    const randomAngle = angle + Math.random();
    const heightVar = (Math.random() - 0.5) * 3;
    
    return new THREE.Vector3(
        Math.cos(randomAngle) * radius,
        2.5 + heightVar,
        Math.sin(randomAngle) * radius
    );
}

/**
 * 生成文字粒子分布
 * @param {string} text - 要生成的文字
 * @param {number} particleCount - 粒子数量
 * @param {number} scale - 缩放因子
 * @returns {Array} 包含x, y, z坐标的对象数组
 */
export function generateTextParticles(text = "Merry Christmas", particleCount = 5000, scale = 1) {
    // 创建Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // 设置文字样式
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 80px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 绘制文字
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // 收集非透明像素位置
    const textPositions = [];
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            const index = (y * canvas.width + x) * 4;
            const alpha = pixels[index + 3];
            
            if (alpha > 128) {
                textPositions.push({
                    x: (x - canvas.width / 2) / 100 * scale,
                    y: (canvas.height / 2 - y) / 100 * scale,
                    z: 0
                });
            }
        }
    }
    
    // 随机选择指定数量的粒子位置
    const result = [];
    for (let i = 0; i < particleCount; i++) {
        const randomIndex = Math.floor(Math.random() * textPositions.length);
        const pos = textPositions[randomIndex];
        
        // 添加一些随机扰动，使文字更自然
        const randomX = (Math.random() - 0.5) * 0.2;
        const randomY = (Math.random() - 0.5) * 0.2;
        const randomZ = (Math.random() - 0.5) * 0.2;
        
        result.push({
            x: pos.x + randomX,
            y: pos.y + randomY,
            z: pos.z + randomZ
        });
    }
    
    return result;
}
