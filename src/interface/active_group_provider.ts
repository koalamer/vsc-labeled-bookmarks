import { Group } from '../group';

export interface ActiveGroupProvider {
    getActiveGroup(): Group;
}