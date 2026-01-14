import { BufferAttribute, BufferGeometry } from 'three';

/**
 * @param  {Array<BufferGeometry>} geometries
 * @param  {Boolean} useGroups
 * @return {BufferGeometry}
 */
function mergeGeometries(geometries, useGroups = false) {
    const isIndexed = geometries[0].index !== null;

    const attributesUsed = new Set(Object.keys(geometries[0].attributes));
    const morphAttributesUsed = new Set(Object.keys(geometries[0].morphAttributes));

    const attributes = {};
    const morphAttributes = {};

    const morphTargetsRelative = geometries[0].morphTargetsRelative;

    const mergedGeometry = new BufferGeometry();

    let offset = 0;

    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        let attributesCount = 0;

        // ensure that all geometries are indexed, or none

        if (isIndexed !== (geometry.index !== null)) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.');
            return null;
        }

        // gather attributes, exit early if they're different

        for (const name in geometry.attributes) {
            if (!attributesUsed.has(name)) {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.');
                return null;
            }

            if (attributes[name] === undefined) attributes[name] = [];

            attributes[name].push(geometry.attributes[name]);

            attributesCount++;
        }

        // ensure geometries have the same number of attributes

        if (attributesCount !== attributesUsed.size) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.');
            return null;
        }

        // gather morph attributes, exit early if they're different

        if (morphTargetsRelative !== geometry.morphTargetsRelative) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.');
            return null;
        }

        for (const name in geometry.morphAttributes) {
            if (!morphAttributesUsed.has(name)) {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.');
                return null;
            }

            if (morphAttributes[name] === undefined) morphAttributes[name] = [];

            morphAttributes[name].push(geometry.morphAttributes[name]);
        }

        if (useGroups) {
            let count;

            if (isIndexed) {
                count = geometry.index.count;
            } else if (geometry.attributes.position !== undefined) {
                count = geometry.attributes.position.count;
            } else {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute');
                return null;
            }

            mergedGeometry.addGroup(offset, count, i);

            offset += count;
        }
    }

    // merge indices

    if (isIndexed) {
        let indexOffset = 0;
        const mergedIndex = [];

        for (let i = 0; i < geometries.length; ++i) {
            const index = geometries[i].index;

            for (let j = 0; j < index.count; ++j) {
                mergedIndex.push(index.getX(j) + indexOffset);
            }

            indexOffset += geometries[i].attributes.position.count;
        }

        mergedGeometry.setIndex(mergedIndex);
    }

    // merge attributes

    for (const name in attributes) {
        const mergedAttribute = mergeAttributes(attributes[name]);

        if (!mergedAttribute) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' + name + ' attribute.');
            return null;
        }

        mergedGeometry.setAttribute(name, mergedAttribute);
    }

    // merge morph attributes

    for (const name in morphAttributes) {
        const numMorphTargets = morphAttributes[name][0].length;

        if (numMorphTargets === 0) break;

        mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
        mergedGeometry.morphAttributes[name] = [];

        for (let i = 0; i < numMorphTargets; ++i) {
            const morphAttributesToMerge = [];

            for (let j = 0; j < morphAttributes[name].length; ++j) {
                morphAttributesToMerge.push(morphAttributes[name][j][i]);
            }

            const mergedMorphAttribute = mergeAttributes(morphAttributesToMerge);

            if (!mergedMorphAttribute) {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' + name + ' morphAttribute.');
                return null;
            }

            mergedGeometry.morphAttributes[name].push(mergedMorphAttribute);
        }
    }

    return mergedGeometry;
}

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {BufferAttribute}
 */
function mergeAttributes(attributes) {
    let TypedArray;
    let itemSize;
    let normalized;
    let gpuType = -1;
    let arrayLength = 0;

    for (let i = 0; i < attributes.length; ++i) {
        const attribute = attributes[i];

        if (TypedArray === undefined) TypedArray = attribute.array.constructor;
        if (TypedArray !== attribute.array.constructor) {
            console.error('THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.');
            return null;
        }

        if (itemSize === undefined) itemSize = attribute.itemSize;
        if (itemSize !== attribute.itemSize) {
            console.error('THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.');
            return null;
        }

        if (normalized === undefined) normalized = attribute.normalized;
        if (normalized !== attribute.normalized) {
            console.error('THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.');
            return null;
        }

        if (gpuType === -1) gpuType = attribute.gpuType;
        if (gpuType !== attribute.gpuType) {
            console.error('THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes.');
            return null;
        }

        arrayLength += attribute.count * itemSize;
    }

    const array = new TypedArray(arrayLength);
    const result = new BufferAttribute(array, itemSize, normalized);
    let offset = 0;

    for (let i = 0; i < attributes.length; ++i) {
        const attribute = attributes[i];
        if (attribute.isInterleavedBufferAttribute) {
            const tupleOffset = offset / itemSize;
            for (let j = 0, l = attribute.count; j < l; j++) {
                for (let c = 0; c < itemSize; c++) {
                    const value = attribute.getComponent(j, c);
                    result.setComponent(j + tupleOffset, c, value);
                }
            }
        } else {
            array.set(attribute.array, offset);
        }

        offset += attribute.count * itemSize;
    }

    if (gpuType !== undefined) {
        result.gpuType = gpuType;
    }

    return result;
}

function mergeGroups(geometry) {
    if (geometry.groups.length === 0) {
        console.warn('THREE.BufferGeometryUtils.mergeGroups(): No groups are defined. Nothing to merge.');
        return geometry;
    }

    let groups = geometry.groups;

    // sort groups by material index

    groups = groups.sort((a, b) => {
        if (a.materialIndex !== b.materialIndex) return a.materialIndex - b.materialIndex;

        return a.start - b.start;
    });

    // create index for non-indexed geometries

    if (geometry.getIndex() === null) {
        const positionAttribute = geometry.getAttribute('position');
        const indices = [];

        for (let i = 0; i < positionAttribute.count; i += 3) {
            indices.push(i, i + 1, i + 2);
        }

        geometry.setIndex(indices);
    }

    // sort index

    const index = geometry.getIndex();

    const newIndices = [];

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];

        const groupStart = group.start;
        const groupLength = groupStart + group.count;

        for (let j = groupStart; j < groupLength; j++) {
            newIndices.push(index.getX(j));
        }
    }

    geometry.dispose(); // Required to force buffer recreation
    geometry.setIndex(newIndices);

    // update groups indices

    let start = 0;

    for (let i = 0; i < groups.length; i++) {
        const group = groups[i];

        group.start = start;
        start += group.count;
    }

    // merge groups

    let currentGroup = groups[0];

    geometry.groups = [currentGroup];

    for (let i = 1; i < groups.length; i++) {
        const group = groups[i];

        if (currentGroup.materialIndex === group.materialIndex) {
            currentGroup.count += group.count;
        } else {
            currentGroup = group;
            geometry.groups.push(currentGroup);
        }
    }

    return geometry;
}

function mergeGeometriesByGroups(geometries) {
    const isIndexed = geometries[0].index !== null;

    const attributesUsed = new Set(Object.keys(geometries[0].attributes));
    const morphAttributesUsed = new Set(Object.keys(geometries[0].morphAttributes));

    const attributes = {};
    const morphAttributes = {};

    const morphTargetsRelative = geometries[0].morphTargetsRelative;

    const mergedGeometry = new BufferGeometry();

    let offset = 0;

    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        let attributesCount = 0;

        // ensure that all geometries are indexed, or none

        if (isIndexed !== (geometry.index !== null)) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.');
            return null;
        }

        // gather attributes, exit early if they're different

        for (const name in geometry.attributes) {
            if (!attributesUsed.has(name)) {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.');
                return null;
            }

            if (attributes[name] === undefined) attributes[name] = [];

            attributes[name].push(geometry.attributes[name]);

            attributesCount++;
        }

        // ensure geometries have the same number of attributes

        if (attributesCount !== attributesUsed.size) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.');
            return null;
        }

        // gather morph attributes, exit early if they're different

        if (morphTargetsRelative !== geometry.morphTargetsRelative) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.');
            return null;
        }

        for (const name in geometry.morphAttributes) {
            if (!morphAttributesUsed.has(name)) {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.');
                return null;
            }

            if (morphAttributes[name] === undefined) morphAttributes[name] = [];

            morphAttributes[name].push(geometry.morphAttributes[name]);
        }

        if (true) {
            let count;

            if (isIndexed) {
                count = geometry.index.count;
            } else if (geometry.attributes.position !== undefined) {
                count = geometry.attributes.position.count;
            } else {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute');
                return null;
            }

            for (let g = 0; g < geometries[i].groups.length; ++g) {
                const group = geometries[i].groups[g];
                mergedGeometry.addGroup(group.start + offset, group.count, group.materialIndex);
            }
            // mergedGeometry.addGroup( offset, count, i );

            offset += count;
        }

        if (!isIndexed) {
        }
    }

    // merge indices

    if (isIndexed) {
        let indexOffset = 0;
        const mergedIndex = [];

        for (let i = 0; i < geometries.length; ++i) {
            const index = geometries[i].index;

            for (let j = 0; j < index.count; ++j) {
                mergedIndex.push(index.getX(j) + indexOffset);
            }

            indexOffset += geometries[i].attributes.position.count;
        }

        mergedGeometry.setIndex(mergedIndex);
    }

    // merge attributes

    for (const name in attributes) {
        const mergedAttribute = mergeAttributes(attributes[name]);

        if (!mergedAttribute) {
            console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' + name + ' attribute.');
            return null;
        }

        mergedGeometry.setAttribute(name, mergedAttribute);
    }

    // merge morph attributes

    for (const name in morphAttributes) {
        const numMorphTargets = morphAttributes[name][0].length;

        if (numMorphTargets === 0) break;

        mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
        mergedGeometry.morphAttributes[name] = [];

        for (let i = 0; i < numMorphTargets; ++i) {
            const morphAttributesToMerge = [];

            for (let j = 0; j < morphAttributes[name].length; ++j) {
                morphAttributesToMerge.push(morphAttributes[name][j][i]);
            }

            const mergedMorphAttribute = mergeAttributes(morphAttributesToMerge);

            if (!mergedMorphAttribute) {
                console.error('THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the ' + name + ' morphAttribute.');
                return null;
            }

            mergedGeometry.morphAttributes[name].push(mergedMorphAttribute);
        }
    }

    if (mergedGeometry.groups.length === 0) return mergedGeometry;

    return mergeGroups(mergedGeometry);
}

export { mergeGeometries, mergeAttributes, mergeGroups, mergeGeometriesByGroups };
